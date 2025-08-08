// =================================================================
//                      ARQUIVO ROBO.JS COMPLETO
// =================================================================

// --- IMPORTS DAS BIBLIOTECAS ---
// Importa os componentes necessários da whatsapp-web.js
const { Client, LocalAuth, Buttons, List, MessageMedia } = require('whatsapp-web.js');
// Importa a biblioteca para gerar o link do QR Code
const qrcode = require('qrcode');
const { randomUUID } = require('crypto'); // Para gerar a chave PIX aleatória
const userState = {}; // "Memória" do bot para saber em que parte da conversa cada usuário está

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


// =================================================================
//          NOVO FLUXO DE MENSAGEM INTERATIVO
// =================================================================
client.on('message', async (msg) => {
    // Ignora mensagens de grupos e status
    if (!msg.from.endsWith('@c.us')) {
        return;
    }

    const contact = await msg.getContact();
    const chat = await msg.getChat();
    const user = msg.from;
    const messageBody = msg.body.trim();

    // --- ESTÁGIO 0: Início da Conversa ---
    // O bot só é ativado se a mensagem for EXATAMENTE "TesteChatbotJG"
    if (messageBody.toLowerCase() === 'testechatbotjg') {
        const name = contact.pushname || "usuário";
        
        await delay(1500);
        await chat.sendStateTyping();
        await delay(1500);

        const welcomeMessage = `Olá! ${name.split(" ")[0]}, me chamo JG e sou o chatbot pessoal do João Gabriel!\n\nComo posso te ajudar hoje?\n\n*1)* Tratar de Assuntos com o João\n*2)* Preciso da ajuda do João\n*3)* Quero o pix do João`;
        
        await client.sendMessage(user, welcomeMessage);
        
        // Define o estado do usuário como "aguardando a escolha do menu"
        userState[user] = 'awaiting_menu_choice';
        return;
    }

    // --- ESTÁGIOS DA CONVERSA (Baseado na "memória") ---
    const currentState = userState[user];

    // Se o bot estiver aguardando a escolha do menu principal
    if (currentState === 'awaiting_menu_choice') {
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1500);

        switch (messageBody) {
            case '1':
                await client.sendMessage(user, 'Ok! O João vai te responder em alguns instantes!');
                delete userState[user]; // Limpa o estado do usuário
                break;
            case '2':
                await client.sendMessage(user, 'Poxa, ele não está disponível agora! Mas ele pode te responder se você apertar a opção 3, quer tentar para ver se funciona?');
                userState[user] = 'awaiting_sim_for_pix'; // Atualiza o estado para aguardar a confirmação
                break;
            case '3':
                const pixKey = randomUUID(); // Gera uma chave aleatória
                await client.sendMessage(user, `Eita coisa boa, segue a chave pix aleatória: ${pixKey}`);
                delete userState[user]; // Limpa o estado do usuário
                break;
            default:
                await client.sendMessage(user, 'Opção inválida. Por favor, responda com o número *1*, *2* ou *3*.');
                // Mantém o estado para o usuário tentar novamente
                break;
        }
        return;
    }

    // Se o bot estiver aguardando a resposta para a pergunta da opção 2
    if (currentState === 'awaiting_sim_for_pix') {
        if (messageBody.toLowerCase() === 'sim') {
            await delay(1000);
            await chat.sendStateTyping();
            await delay(1500);
            const pixKey = randomUUID();
            await client.sendMessage(user, `Eita coisa boa, segue a chave pix aleatória: ${pixKey}`);
        } else {
            await client.sendMessage(user, 'Ok, sem problemas! Se precisar de algo mais, é só chamar.');
        }
        delete userState[user]; // Limpa o estado do usuário após a resposta
        return;
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


