/**
 * O visualizador do frontend roda o HTML do aluno num iframe com sandbox="allow-scripts"
 * (origem opaca), entao o parent nao consegue ler contentDocument para medir a altura. Como o
 * frontend passou a apontar o iframe direto para a URL desta API (sem baixar/criar blob), quem
 * injeta o medidor de altura passa a ser este backend: inserimos um <script> inline autocontido
 * no HTML servido, que mede a altura e reporta ao parent por postMessage.
 *
 * O "source" da mensagem e o "type" precisam bater exatamente com o que o listener do frontend
 * valida (Const_viewerHeightMessageSource em component/shared/content_viewer_iframe_html.ts).
 */

export const Const_viewerHeightMessageSource = "somente-alunos-viewer"

export function Function_injectViewerHeightReporterScript(Parameter_html: string, Parameter_frontendOrigin: string): string {
	// targetOrigin restringe o postMessage a nossa pagina do frontend, para nenhuma outra origem
	// conseguir escutar as mensagens do conteudo. A origem do parent vem do env (Env_originFrontend).
	const Const_targetOrigin = typeof Parameter_frontendOrigin === "string" && Parameter_frontendOrigin.length > 0
		? Parameter_frontendOrigin
		: "*"

	// Script em sintaxe conservadora (sem optional chaining/arrow em cadeia critica) para
	// funcionar tambem em webviews mais antigas de celular.
	const Const_injectedScript = [
		"<script>",
		"(function () {",
		`	var Const_targetOrigin = ${JSON.stringify(Const_targetOrigin)};`,
		`	var Const_messageSource = ${JSON.stringify(Const_viewerHeightMessageSource)};`,
		"	var Let_lastHeight = 0;",
		"	var Let_reportQueued = false;",
		"",
		"	function Function_measureHeight() {",
		"		var Const_root = document.documentElement;",
		"		var Const_body = document.body;",
		"		var Let_height = 0;",
		"		if (Const_root && Const_root.scrollHeight > Let_height) { Let_height = Const_root.scrollHeight; }",
		"		if (Const_body && Const_body.scrollHeight > Let_height) { Let_height = Const_body.scrollHeight; }",
		"		if (Const_body && Const_body.offsetHeight > Let_height) { Let_height = Const_body.offsetHeight; }",
		"		return Let_height;",
		"	}",
		"",
		"	function Function_reportHeight() {",
		"		var Const_height = Function_measureHeight();",
		"		if (Const_height > 0 && Const_height !== Let_lastHeight) {",
		"			Let_lastHeight = Const_height;",
		"			window.parent.postMessage({ source: Const_messageSource, type: \"viewer-height\", height: Const_height }, Const_targetOrigin);",
		"		}",
		"	}",
		"",
		"	function Function_queueReport() {",
		"		if (Let_reportQueued) { return; }",
		"		Let_reportQueued = true;",
		"		var Const_schedule = window.requestAnimationFrame || function (Parameter_callback) { setTimeout(Parameter_callback, 16); };",
		"		Const_schedule(function () {",
		"			Let_reportQueued = false;",
		"			Function_reportHeight();",
		"		});",
		"	}",
		"",
		"	window.addEventListener(\"load\", Function_reportHeight);",
		"	window.addEventListener(\"resize\", Function_queueReport);",
		"",
		"	if (typeof ResizeObserver === \"function\") {",
		"		var Const_resizeObserver = new ResizeObserver(Function_queueReport);",
		"		if (document.documentElement) { Const_resizeObserver.observe(document.documentElement); }",
		"		if (document.body) { Const_resizeObserver.observe(document.body); }",
		"	}",
		"	if (typeof MutationObserver === \"function\" && document.body) {",
		"		new MutationObserver(Function_queueReport).observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });",
		"	}",
		"",
		"	// Rede de seguranca para imagem/fonte que carrega depois sem disparar os observers.",
		"	setInterval(Function_reportHeight, 700);",
		"",
		"	Function_reportHeight();",
		"})();",
		"</" + "script>"
	].join("\n")

	const Const_closingBodyIndex = Parameter_html.toLowerCase().lastIndexOf("</body>")
	if (Const_closingBodyIndex < 0) {
		return `${Parameter_html}${Const_injectedScript}`
	}

	return [
		Parameter_html.slice(0, Const_closingBodyIndex),
		Const_injectedScript,
		Parameter_html.slice(Const_closingBodyIndex)
	].join("")
}
