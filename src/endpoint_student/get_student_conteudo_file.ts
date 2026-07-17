import { Function_getContentFileFromR2, Function_getD1, Function_getFuncionName, Function_getResponseByR2ObjectBody, Function_getResponseError, Function_getStudentAcquiredContentUuidArray, Function_getStudentAuthenticated, Function_isError, Function_htmlToPdf } from "../function_global"
import { Function_injectViewerHeightReporterScript } from "../function_inject_viewer_height_reporter"


export class Class_GetStudentConteudoFile {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

			// \/ Le query param obrigatorio
			const Const_newUrl = new URL(Parameter_request.url)
			const Const_contentUuid = Const_newUrl.searchParams.get('content_uuid')?.trim()
			if (typeof Const_contentUuid !== 'string' || Const_contentUuid.length <= 1) {
				return Function_getResponseError({ typ: 'logical', msg: 'content_uuid query parameter is required', inf: { url: Parameter_request.url, searchParams: [...Const_newUrl.searchParams.entries()] }, loc: Function_getFuncionName(), err: true }, 452, 'Missing content_uuid')
			}
			// /\ Le query param obrigatorio

			// \/ Busca conteudo pelo UUID informado
			const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['content_uuid', 'student_uuid_content', 'preview_file_uuid_content', 'full_file_uuid_content', 'verified_content', 'name_content'], {
				content_uuid: Const_contentUuid
			})
			if (Function_isError(Const_contentArray)) {
				return Function_getResponseError(Const_contentArray, 453, 'Error fetching content by UUID')
			}

			const Const_content = Const_contentArray?.[0]
			if (!Const_content) {
				return Function_getResponseError({ typ: 'logical', msg: 'Content not found', inf: { Const_contentUuid }, loc: Function_getFuncionName(), err: true }, 454, 'Content not found')
			}

			if (!Const_content.verified_content) {
				return Function_getResponseError({ typ: 'logical', msg: 'Content is not approved by admin', inf: { Const_contentUuid }, loc: Function_getFuncionName(), err: true }, 455, 'Content not available')
			}
			// /\ Busca conteudo pelo UUID informado

			// \/ Decide se aluno recebe arquivo completo ou preview
			const Const_acquiredContentUuidArray = await Function_getStudentAcquiredContentUuidArray(Parameter_env, Const_studentAuthenticated.student_uuid)
			if (Function_isError(Const_acquiredContentUuidArray)) {
				return Function_getResponseError(Const_acquiredContentUuidArray, 456, 'Error fetching acquired content')
			}

			const Const_isAcquiredContent = Const_acquiredContentUuidArray.includes(Const_content.content_uuid)
			const Const_isContentOwner = Const_content.student_uuid_content === Const_studentAuthenticated.student_uuid
			const Const_useFullContent = Const_studentAuthenticated.isAllContentUnlocked || Const_isAcquiredContent || Const_isContentOwner
			const Const_fileUuid = Const_useFullContent ? Const_content.full_file_uuid_content : Const_content.preview_file_uuid_content
			if (typeof Const_fileUuid !== 'string' || Const_fileUuid.length <= 1) {
				return Function_getResponseError({ typ: 'logical', msg: 'Requested content file UUID is empty', inf: { Const_contentUuid, Const_useFullContent, Const_isAcquiredContent, Const_isContentOwner }, loc: Function_getFuncionName(), err: true }, 457, 'Content file not available')
			}
			// /\ Decide se aluno recebe arquivo completo ou preview

			// \/ Busca arquivo no R2
			const Const_r2ObjectBody = await Function_getContentFileFromR2(Parameter_env, Const_fileUuid)
			if (Function_isError(Const_r2ObjectBody)) {
				return Function_getResponseError(Const_r2ObjectBody, 458, 'Error fetching content file from R2')
			}

			if (Const_r2ObjectBody === null) {
				return Function_getResponseError({ typ: 'logical', msg: 'Content file UUID was not found in R2', inf: { Const_contentUuid, Const_fileUuid }, loc: Function_getFuncionName(), err: true }, 459, 'Content file not found')
			}
			// /\ Busca arquivo no R2

			// \/ Se requisitado, retorne PDF para download (se já for PDF ou convertendo HTML)
			const Const_pdfDownloadParam = Const_newUrl.searchParams.get('pdf_download')?.trim()
			const Const_wantPdfDownload = Const_pdfDownloadParam === 'true'

			if (Const_wantPdfDownload) {
				const Const_headersMeta = new Headers()
				try {
					Const_r2ObjectBody.writeHttpMetadata(Const_headersMeta)
				} catch {}

				const Const_contentTypeFromHeaders = (Const_headersMeta.get('content-type') || '').toLowerCase()
				const Const_storedContentType = (Const_r2ObjectBody.customMetadata && (Const_r2ObjectBody.customMetadata.stored_content_type || Const_r2ObjectBody.customMetadata.storedContentType)) || ''
				const Const_originalFileName = (Const_r2ObjectBody.customMetadata && Const_r2ObjectBody.customMetadata.original_file_name) || ''
				const Const_lowerContentType = (Const_contentTypeFromHeaders + ' ' + Const_storedContentType).toLowerCase()
				const Const_isPdf = Const_lowerContentType.includes('application/pdf') || (typeof Const_originalFileName === 'string' && Const_originalFileName.toLowerCase().endsWith('.pdf'))

				if (Const_isPdf) {
					const Const_arrayBufferPdf = await Const_r2ObjectBody.arrayBuffer()
					const Let_filenameParts: Array<string> = ['completo']
					if (Let_filenameParts.length === 1) Let_filenameParts.push(Const_content.name_content || Const_content.content_uuid)
					const Const_fileNameFinal = `${Let_filenameParts.join('_')}.pdf`

					return new Response(Const_arrayBufferPdf, {
						status: 200,
						headers: {
							'Content-Type': 'application/pdf',
							'Content-Disposition': `attachment; filename="${Const_fileNameFinal}"`
						}
					})
				}

				// HTML -> convert to PDF
				const Const_html = await Const_r2ObjectBody.text()

				// Pega PDF no R2 cache \/
				let Let_pdfOrError: string | ArrayBuffer | Type_isError

				const Const_keyCachePdf = `pdf_cache_${Const_fileUuid}`
				const Const_cacheArrayBufferOrNull = await Parameter_env.R2_somenteAlunosAll2?.get(Const_keyCachePdf)

				if (Const_cacheArrayBufferOrNull) {
					Let_pdfOrError = await Const_cacheArrayBufferOrNull.arrayBuffer()
				}
				// Pega PDF no R2 cache /\

				else {
					Let_pdfOrError = await Function_htmlToPdf(Parameter_env, Const_html)
					if (!(Let_pdfOrError instanceof ArrayBuffer)) {
						return Function_getResponseError({ typ: 'logical', msg: 'Error generating PDF from HTML', inf: { result: Let_pdfOrError }, loc: Function_getFuncionName(), err: true }, 460, 'PDF generation error')
					}

					// Salva PDF no R2 cache \/
					await Parameter_env.R2_somenteAlunosAll2?.put(Const_keyCachePdf, Let_pdfOrError, {
						httpMetadata: {
							contentType: 'application/pdf'
						},
						customMetadata: {
							createDate: new Date().toISOString()
						}
					})
					// Salva PDF no R2 cache /\
				}

				const Let_filenameParts2: Array<string> = ['completo']
				if (Let_filenameParts2.length === 1) Let_filenameParts2.push(Const_content.name_content || Const_content.content_uuid)
				const Const_fileNameFinal2 = `${Let_filenameParts2.join('_')}.pdf`

				return new Response(Let_pdfOrError, {
					status: 200,
					headers: {
						'Content-Type': 'application/pdf',
						'Content-Disposition': `attachment; filename="${Const_fileNameFinal2}"`
					}
				})
			}
			// /\ Se requisitado, retorne PDF para download (se já for PDF ou convertendo HTML)

			// \/ Retorna arquivo final
			// O frontend aponta o iframe (sandbox="allow-scripts") direto para esta URL. Para o HTML
			// do aluno reportar a propria altura ao parent, injetamos aqui o <script> medidor antes
			// de servir. Conteudo nao-HTML (ex: PDF) continua sendo servido por streaming, sem alteracao.
			const Const_frontendOrigin = typeof Parameter_env.Env_originFrontend === 'string' ? Parameter_env.Env_originFrontend : ''

			// Descobre o content-type gravado no R2 para decidir se injeta o medidor.
			const Const_r2Headers = new Headers()
			try {
				Const_r2ObjectBody.writeHttpMetadata(Const_r2Headers)
			} catch {}
			const Const_r2ContentType = (Const_r2Headers.get('content-type') || '').toLowerCase()
			const Const_isHtmlResponse = Const_r2ContentType.includes('text/html') || Const_r2ContentType.includes('application/xhtml+xml')

			if (Const_isHtmlResponse) {
				const Const_htmlOriginal = await Const_r2ObjectBody.text()
				const Const_htmlInjected = Function_injectViewerHeightReporterScript(Const_htmlOriginal, Const_frontendOrigin)

				const Const_htmlHeaders = new Headers()
				Const_htmlHeaders.set('content-type', Const_r2Headers.get('content-type') || 'text/html; charset=utf-8')
				Const_htmlHeaders.set('content-disposition', `inline; filename="${Const_r2ObjectBody.key}"`)
				// So o proprio frontend pode embutir o conteudo pago num iframe.
				if (Const_frontendOrigin) {
					Const_htmlHeaders.set('content-security-policy', `frame-ancestors ${Const_frontendOrigin}`)
				}
				Const_htmlHeaders.set('x-content-file-mode', Const_useFullContent ? 'full' : 'preview')

				return new Response(Const_htmlInjected, { status: 200, headers: Const_htmlHeaders })
			}

			const Const_response = Function_getResponseByR2ObjectBody(Const_r2ObjectBody)
			if (Const_frontendOrigin) {
				Const_response.headers.set('content-security-policy', `frame-ancestors ${Const_frontendOrigin}`)
			}
			Const_response.headers.set('x-content-file-mode', Const_useFullContent ? 'full' : 'preview')
			return Const_response
			// /\ Retorna arquivo final
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error getting student content file', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
