// =================================================================
//                      ARQUIVO ROBO.JS COMPLETO
// =================================================================

// --- IMPORTS DAS BIBLIOTECAS ---
// Importa os componentes necessários da whatsapp-web.js
const { Client, LocalAuth, Buttons, List, MessageMedia } = require('whatsapp-web.js');
// Importa a biblioteca para gerar o link do QR Code
const qrcode = require('qrcode');

console.log("Iniciando o bot...");

// --- INICIALIZAÇÃO DO CLIENTE COM AS CONFIGURAÇÕES ---
const client = new Client({
    // 1. Estratégia de Autenticação Local para salvar a sessão e não precisar ler o QR Code a cada reinicialização
    authStrategy: new LocalAuth(),
    
    // 2. Configurações do Puppeteer para rodar no ambiente da Railway (servidor Linux)
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // Essencial para ambientes de servidor
            '--disable-gpu'
        ],
    }
});


// --- EVENTOS DO CLIENTE ---

// Evento 1: Geração do QR Code como um Link
client.on('qr', qr => {
    console.log('QR Code recebido! Escaneie a imagem que aparecer no link abaixo:');
    // Usamos uma API externa para gerar a imagem do QR Code a partir do texto recebido
    console.log(`LINK PARA O QR CODE -> https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qr)}`);
});

// Evento 2: Cliente está pronto e conectado
client.on('ready', () => {
    console.log('WhatsApp conectado.✅ Bot está pronto para operar!');
});

// Evento 3: Tratamento de Desconexão
// Acionado se a conexão cair por algum motivo
client.on('disconnected', (reason) => {
    console.log('Cliente foi desconectado!', reason);
    console.log('Tentando reconectar em 30 segundos...');
    setTimeout(() => {
        client.initialize(); 
    }, 30000); // Tenta reiniciar após 30 segundos
});

// Evento 4: Recebimento de Mensagens (Sua lógica de funil)
client.on('message', async msg => {
    if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola)/i) && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();
        
        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        
        const contact = await msg.getContact();
        const name = contact.pushname;
        
        await client.sendMessage(msg.from, 'Olá! ' + name.split(" ")[0] + ' tudo bem? quem te enviou essa mensagem foi o robô que acabamos de criar, incrível né😎');
        
        await delay(3000);
        await chat.sendStateTyping();
        await client.sendMessage(msg.from, 'A versão grátis do robô automatiza apenas mensagens de texto.');
        
        await delay(3000);
        await chat.sendStateTyping();
        await client.sendMessage(msg.from, 'Na versão PRO: desbloqueie tudo!\n\n' +
            '✍️ Envio de textos\n' +
            '🎙️ Áudios\n' +
            '🖼️ Imagens\n' +
            '🎥 Vídeos\n' +
            '📂 Arquivos\n\n' +
            '💡 Simulação de "digitando..." e "gravando áudio"\n' +
            '🚀 Envio de mensagens em massa\n' +
            '📇 Captura automática de contatos\n' +
            '💻 Aprenda como deixar o robô funcionando 24 hrs, com o PC desligado\n' +
            '✅ E 3 Bônus exclusivos\n\n' +
            '🔥 Adquira a versão PRO agora: https://pay.kiwify.com.br/FkTOhRZ?src=pro'
        );
    }
});


// --- MECANISMO DE SOBREVIVÊNCIA (KEEP-ALIVE) ---
// Ping periódico para manter o processo ativo na Railway
setInterval(() => {
    client.getState().then((state) => {
        console.log('Status da Conexão:', state || 'Desconectado');
    }).catch((err) => {
        console.log('Erro ao verificar status da conexão:', err);
    });
}, 60000); // Verifica a cada 60 segundos (1 minuto)


// --- INICIALIZAÇÃO DO BOT E FUNÇÕES AUXILIARES ---
console.log("Inicializando o cliente do WhatsApp...");
client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms));
