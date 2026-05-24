const fs = require('fs');
const path = require('path');

// 1. Captura os argumentos da linha de comando
const args = process.argv.slice(2);
let fileParam = '';
let envParam = '';

args.forEach(arg => {
  if (arg.startsWith('--file=')) {
    fileParam = arg.substring(7); // Extrai o valor após "--file="
  } else if (arg.startsWith('--env=')) {
    envParam = arg.substring(6);  // Extrai o valor após "--env="
  }
});

// Validação dos parâmetros obrigatórios
if (!fileParam || !envParam) {
  console.error('❌ Parâmetros inválidos ou ausentes!');
  console.log('\nUso correto:');
  console.log('  node generate_env_secret.js --file=<arquivos_separados_por_virgula> --env=<ambientes_separados_por_virgula>');
  console.log('\nExemplo:');
  console.log('  node generate_env_secret.js --file=env_secret.jsonc,EXAMPLE_env_secret.jsonc --env=production,dev,local\n');
  process.exit(1);
}

// 2. Separa a lista de arquivos pela vírgula e tenta encontrar o primeiro que existe
const filesToCheck = fileParam.split(',').map(f => f.trim()).filter(Boolean);
let selectedFile = null;
let selectedFilePath = '';

for (let i = 0; i < filesToCheck.length; i++) {
  const file = filesToCheck[i];
  const resolvedPath = path.resolve(file);

  if (fs.existsSync(resolvedPath)) {
    selectedFile = file;
    selectedFilePath = resolvedPath;
    break; // Encontrou o arquivo, encerra a busca
  } else {
    // Se não for o último arquivo da lista, avisa que tentará o próximo
    if (i < filesToCheck.length - 1) {
      console.warn(`⚠️  Aviso: Arquivo "${file}" não encontrado. Tentando o próximo: "${filesToCheck[i + 1]}"...`);
    } else {
      console.warn(`⚠️  Aviso: Arquivo "${file}" não encontrado.`);
    }
  }
}

// Se nenhum dos arquivos existir, avisa e sai com sucesso para que o próximo comando do "&&" rode
if (!selectedFile) {
  console.warn(`⚠️  Aviso: Nenhum dos arquivos de configuração especificados (${fileParam}) foi encontrado. A geração de variáveis de ambiente será ignorada.`);
  process.exit(0);
}

console.log(`📖 Lendo arquivo de configuração encontrado: ${selectedFile}...`);
const fileContent = fs.readFileSync(selectedFilePath, 'utf-8');

// 3. Remove comentários mantendo strings intactas (evita quebrar URLs como "https://")
const cleanJson = fileContent.replace(
  /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")|(\/\*[\s\S]*?\*\/|\/\/.*)/g,
  (match, string) => (string ? string : '')
);

let config;
try {
  config = JSON.parse(cleanJson);
} catch (err) {
  console.error('❌ Erro de sintaxe ao processar o JSON/JSONC. Verifique a estrutura.');
  console.error(err.message);
  process.exit(1);
}

const envsInConfig = config.env;
if (!envsInConfig) {
  console.error('❌ O bloco "env" não foi encontrado no arquivo.');
  process.exit(1);
}

// 4. Separa a string de ambientes pela vírgula
const targetEnvs = envParam.split(',').map(e => e.trim()).filter(Boolean);

console.log(`⚙️  Processando os ambientes (chave: vars_secret): ${targetEnvs.join(', ')}...`);

targetEnvs.forEach(envName => {
  const envConfig = envsInConfig[envName];

  if (!envConfig) {
    console.warn(`⚠️  Aviso: O ambiente "${envName}" não existe no arquivo "${selectedFile}". Ignorando...`);
    return;
  }

  // Busca por "vars_secret" conforme configurado
  if (!envConfig.vars_secret) {
    console.warn(`⚠️  Aviso: O ambiente "${envName}" não possui a chave "vars_secret" em "${selectedFile}". Ignorando...`);
    return;
  }

  let envContent = '';

  // Converte o objeto vars_secret em formato KEY=VALUE
  for (const [key, value] of Object.entries(envConfig.vars_secret)) {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    // Se o valor contiver espaços, quebras de linha ou sinal de igual, envolve em aspas
    if (stringValue.includes(' ') || stringValue.includes('\n') || stringValue.includes('=')) {
      envContent += `${key}="${stringValue.replace(/"/g, '\\"')}"\n`;
    } else {
      envContent += `${key}=${stringValue}\n`;
    }
  }

  // Salva o arquivo .env.[ambiente] correspondente (ex: .env.local)
  const envFileName = `.env.${envName}`;
  const envFilePath = path.join(process.cwd(), envFileName);

  fs.writeFileSync(envFilePath, envContent);
  console.log(`  ✅ Criado: ${envFileName}`);
});

console.log('\n🎉 Concluído!');
