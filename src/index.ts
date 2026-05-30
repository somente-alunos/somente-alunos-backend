import { Class_PostAdminStudent } from "./endpoint_admin/post_admin_student"
import { Class_PostStudentEntrar } from "./endpoint_student/post_student_entrar"
import { Class_GetStudentCursoSpecific as Class_GetStudentOrAdminCursoEspecifico } from "./endpoint_student/get_student_or_admin_curso_especifico"
import { Class_PatchStudentConfirmaFaculdadeECurso } from "./endpoint_student/patch_student_confirma_faculdade_e_curso"
import { Class_GetStudentBiblioteca } from "./endpoint_student/get_student_biblioteca"
import { Class_GetStudentConteudoFile } from "./endpoint_student/get_student_conteudo_file"
import { Class_GetStudentCarrinho } from "./endpoint_student/get_student_carrinho"
import { Class_PatchStudentCarrinho } from "./endpoint_student/patch_student_carrinho"
import { Class_PostAdminConfigWebhookEfiBank } from "./endpoint_admin/post_admin_config_webhook_efi_bank"
import { Class_GetAdminConfigWebhookEfiBank } from "./endpoint_admin/get_admin_config_webhook_efi_bank"
import { Class_PostStudentGerarPagamentoPix } from "./endpoint_student/post_student_gerar_pagamento_pix"
import { Class_PostEfiBankWebhook } from "./endpoin_efi_bank/post_efi_bank_webhook"
import { Class_GetStudentOrAdminFaculdadeTodas } from "./endpoint_student/get_student_or_admin_faculdade_todas"
import { Class_GetStudentPostado } from "./endpoint_student/get_student_postado"
import { Class_PostStudentConteudo } from "./endpoint_student/post_student_conteudo"
import { Class_PostStudentConteudoFile } from "./endpoint_student/post_student_conteudo_file"
import { Class_DeleteStudentConteudoFile } from "./endpoint_student/delete_student_conteudo_file"
import { Class_PatchStudentConteudo } from "./endpoint_student/patch_student_conteudo"
import { Class_DeleteStudentConteudo } from "./endpoint_student/delete_student_conteudo"
import { Class_GetStudentCarteira } from "./endpoint_student/get_student_carteira"
import { Class_PatchAdminHistoricoPagamento } from "./endpoint_admin/patch_admin_historico_pagamento"
import { Class_PostAdminHistoricoPagamento } from "./endpoint_admin/post_admin_historico_pagamento"
import { Class_GetAdminMetrica } from "./endpoint_admin/get_admin_metrica"
import { Class_PostAdminFaculdade } from "./endpoint_admin/post_admin_faculdade"
import { Class_PatchAdminFaculdade } from "./endpoint_admin/patch_admin_faculdade"
import { Class_DeleteAdminFaculdade } from "./endpoint_admin/delete_admin_faculdade"
import { Class_PostAdminCurso } from "./endpoint_admin/post_admin_curso"
import { Class_PatchAdminCurso } from "./endpoint_admin/patch_admin_curso"
import { Class_DeleteAdminCurso } from "./endpoint_admin/delete_admin_curso"
import { Class_PostAdminEntrar } from "./endpoint_admin/post_admin_entrar"
import { Class_PostAdminConteudo } from "./endpoint_admin/post_admin_conteudo"
import { Class_PostAdminConteudoFile } from "./endpoint_admin/post_admin_conteudo_file"
import { Class_PatchAdminConteudo } from "./endpoint_admin/patch_admin_conteudo"
import { Class_DeleteAdminConteudoFile } from "./endpoint_admin/delete_admin_conteudo_file"
import { Class_DeleteAdminConteudo } from "./endpoint_admin/delete_admin_conteudo"
import { Class_GetAdminConteudo } from "./endpoint_admin/get_admin_conteudo"
import { Class_PostStudentDenuncia } from "./endpoint_student/post_student_denuncia"
import { Class_GetAdminDenuncia } from "./endpoint_admin/get_admin_denuncia"



export default {
	async fetch(Parameter_request: Request, Parameter_env: Env, Parameter_ctx: ExecutionContext): Promise<Response> {
		if (Parameter_request.method === 'OPTIONS') {
			return Function_handleOptions(Parameter_request, Parameter_env)
		}

		const Const_response = await Function_handleRequest(Parameter_request, Parameter_env, Parameter_ctx)

		if (Const_response.status >= 300 && Const_response.status <= 399) {
			return Const_response
		}

		const Const_origin = Parameter_request.headers.get('Origin')
		if (['http://127.0.0.1:8787', 'http://127.0.0.1:8788'].indexOf(Const_origin || '') >= 0) {
			Const_response.headers.set('Access-Control-Allow-Origin', Const_origin || 'none')
		}

		else {
			Const_response.headers.set('Access-Control-Allow-Origin', Parameter_env?.Env_originFrontend || 'none')
		}

		Const_response.headers.set('Access-Control-Allow-Credentials', 'true')
		Const_response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH')
		Const_response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
		Const_response.headers.set('Access-Control-Expose-Headers', 'Authorization, Content-Type, Content-Disposition')
		Const_response.headers.set('Access-Control-Max-Age', '86400')

		return Const_response
	}
}

async function Function_handleOptions(Parameter_request: Request, Parameter_env: Env): Promise<Response> {
	const Const_response = new Response(null, { status: 200 })

	const Const_origin = Parameter_request.headers.get('Origin')
	if (['http://127.0.0.1:8787', 'http://127.0.0.1:8788'].indexOf(Const_origin || '') >= 0) {
		Const_response.headers.set('Access-Control-Allow-Origin', Const_origin || 'none')
	}

	else {
		Const_response.headers.set('Access-Control-Allow-Origin', Parameter_env?.Env_originFrontend || 'none')
	}

	Const_response.headers.set('Access-Control-Allow-Credentials', 'true')
	Const_response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH')
	Const_response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
	Const_response.headers.set('Access-Control-Expose-Headers', 'Authorization, Content-Type, Content-Disposition')
	Const_response.headers.set('Access-Control-Max-Age', '86400')
	return Const_response
}

async function Function_handleRequest(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
	const Const_newUrl = new URL(Parameter_request.url)
	const Const_method = Parameter_request.method
	const Const_pathName = Const_newUrl.pathname === '/' ? '/' : Const_newUrl.pathname.replace(/\/$/, '') // Remove o último '/' se existir

	// POST /post/admin/student
	if (Const_pathName === '/post/admin/student' && Const_method === 'POST') {
		return await Class_PostAdminStudent.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// POST /post/admin/entrar
	else if (Const_pathName === '/post/admin/entrar' && Const_method === 'POST') {
		return await Class_PostAdminEntrar.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// POST /post/student/entrar
	else if (Const_pathName === '/post/student/entrar' && Const_method === 'POST') {
		return await Class_PostStudentEntrar.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// GET /get/student-or-admin/curso/especifico
	else if (Const_pathName === '/get/student-or-admin/curso/especifico' && Const_method === 'GET') {
		return await Class_GetStudentOrAdminCursoEspecifico.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// PATCH /patch/student/confirma-faculdade-e-curso
	else if (Const_pathName === '/patch/student/confirma-faculdade-e-curso' && Const_method === 'PATCH') {
		return await Class_PatchStudentConfirmaFaculdadeECurso.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// GET /get/student/biblioteca
	else if (Const_pathName === '/get/student/biblioteca' && Const_method === 'GET') {
		return await Class_GetStudentBiblioteca.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// GET /get/student/conteudo/file
	else if (Const_pathName === '/get/student/conteudo/file' && Const_method === 'GET') {
		return await Class_GetStudentConteudoFile.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// GET /get/student/carrinho
	else if (Const_pathName === '/get/student/carrinho' && Const_method === 'GET') {
		return await Class_GetStudentCarrinho.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// PATCH /patch/student/carrinho
	else if (Const_pathName === '/patch/student/carrinho' && Const_method === 'PATCH') {
		return await Class_PatchStudentCarrinho.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// POST /post/admin/config-webhook-efi-bank
	else if (Const_pathName === '/post/admin/config-webhook-efi-bank' && Const_method === 'POST') {
		return await Class_PostAdminConfigWebhookEfiBank.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// GET /get/admin/config-webhook-efi-bank
	else if (Const_pathName === '/get/admin/config-webhook-efi-bank' && Const_method === 'GET') {
		return await Class_GetAdminConfigWebhookEfiBank.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// POST /post/student/gerar-pagamento-pix
	else if (Const_pathName === '/post/student/gerar-pagamento-pix' && Const_method === 'POST') {
		return await Class_PostStudentGerarPagamentoPix.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// POST /post/efi-bank/webhook
	else if (Const_pathName === '/post/efi-bank/webhook' && Const_method === 'POST') {
		return await Class_PostEfiBankWebhook.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// GET /get/student-or-admin/faculdade/todas
	else if (Const_pathName === '/get/student-or-admin/faculdade/todas' && Const_method === 'GET') {
		return await Class_GetStudentOrAdminFaculdadeTodas.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// GET /get/student/postado
	else if (Const_pathName === '/get/student/postado' && Const_method === 'GET') {
		return await Class_GetStudentPostado.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// POST /post/student/conteudo
	else if (Const_pathName === '/post/student/conteudo' && Const_method === 'POST') {
		return await Class_PostStudentConteudo.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// POST /post/student/conteudo/file
	else if (Const_pathName === '/post/student/conteudo/file' && Const_method === 'POST') {
		return await Class_PostStudentConteudoFile.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// PATCH /patch/student/conteudo
	else if (Const_pathName === '/patch/student/conteudo' && Const_method === 'PATCH') {
		return await Class_PatchStudentConteudo.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// DELETE /delete/student/conteudo/file
	else if (Const_pathName === '/delete/student/conteudo/file' && Const_method === 'DELETE') {
		return await Class_DeleteStudentConteudoFile.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// DELETE /delete/student/conteudo
	else if (Const_pathName === '/delete/student/conteudo' && Const_method === 'DELETE') {
		return await Class_DeleteStudentConteudo.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// POST /post/admin/conteudo
	else if (Const_pathName === '/post/admin/conteudo' && Const_method === 'POST') {
		return await Class_PostAdminConteudo.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// POST /post/admin/conteudo/file
	else if (Const_pathName === '/post/admin/conteudo/file' && Const_method === 'POST') {
		return await Class_PostAdminConteudoFile.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// PATCH /patch/admin/conteudo
	else if (Const_pathName === '/patch/admin/conteudo' && Const_method === 'PATCH') {
		return await Class_PatchAdminConteudo.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// DELETE /delete/admin/conteudo/file
	else if (Const_pathName === '/delete/admin/conteudo/file' && Const_method === 'DELETE') {
		return await Class_DeleteAdminConteudoFile.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// DELETE /delete/admin/conteudo
	else if (Const_pathName === '/delete/admin/conteudo' && Const_method === 'DELETE') {
		return await Class_DeleteAdminConteudo.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// GET /get/admin/conteudo
	else if (Const_pathName === '/get/admin/conteudo' && Const_method === 'GET') {
		return await Class_GetAdminConteudo.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// GET /get/student/carteira
	else if (Const_pathName === '/get/student/carteira' && Const_method === 'GET') {
		return await Class_GetStudentCarteira.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// POST /post/student/denuncia
	else if (Const_pathName === '/post/student/denuncia' && Const_method === 'POST') {
		return await Class_PostStudentDenuncia.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// PATCH /patch/admin/historico-pagamento
	else if (Const_pathName === '/patch/admin/historico-pagamento' && Const_method === 'PATCH') {
		return await Class_PatchAdminHistoricoPagamento.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// POST /post/admin/historico-pagamento
	else if (Const_pathName === '/post/admin/historico-pagamento' && Const_method === 'POST') {
		return await Class_PostAdminHistoricoPagamento.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// POST /post/admin/faculdade
	else if (Const_pathName === '/post/admin/faculdade' && Const_method === 'POST') {
		return await Class_PostAdminFaculdade.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// PATCH /patch/admin/faculdade
	else if (Const_pathName === '/patch/admin/faculdade' && Const_method === 'PATCH') {
		return await Class_PatchAdminFaculdade.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// DELETE /delete/admin/faculdade
	else if (Const_pathName === '/delete/admin/faculdade' && Const_method === 'DELETE') {
		return await Class_DeleteAdminFaculdade.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// POST /post/admin/curso
	else if (Const_pathName === '/post/admin/curso' && Const_method === 'POST') {
		return await Class_PostAdminCurso.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// PATCH /patch/admin/curso
	else if (Const_pathName === '/patch/admin/curso' && Const_method === 'PATCH') {
		return await Class_PatchAdminCurso.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// DELETE /delete/admin/curso
	else if (Const_pathName === '/delete/admin/curso' && Const_method === 'DELETE') {
		return await Class_DeleteAdminCurso.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// GET /get/admin/metrica
	else if (Const_pathName === '/get/admin/metrica' && Const_method === 'GET') {
		return await Class_GetAdminMetrica.main(Parameter_request, Parameter_env, Parameter_context)
	}

	// GET /get/admin/denuncia
	else if (Const_pathName === '/get/admin/denuncia' && Const_method === 'GET') {
		return await Class_GetAdminDenuncia.main(Parameter_request, Parameter_env, Parameter_context)
	}

	else {
		return new Response("Endpoint not Found", { status: 404 })
	}
}
