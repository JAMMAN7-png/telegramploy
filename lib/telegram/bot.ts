import { Bot, InputFile } from 'grammy';

let botInstance: Bot | null = null;

export function getBot(): Bot {
  if (!botInstance) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN environment variable is not set');
    }

    try {
      botInstance = new Bot(token);
    } catch (error) {
      throw new Error(`Failed to create Telegram bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  return botInstance;
}

export async function sendFileToTelegram(
  chatId: string,
  filePath: string,
  caption: string
) {
  if (!chatId || !filePath || !caption) {
    throw new Error('Chat ID, file path, and caption are required');
  }

  const bot = getBot();

  console.log(`📤 Sending file to Telegram: ${filePath}`);

  try {
    const file = new InputFile(filePath);
    const result = await bot.api.sendDocument(chatId, file, {
      caption,
      parse_mode: 'HTML',
    });

    console.log(`✅ File sent, message ID: ${result.message_id}`);
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to send file to Telegram chat ${chatId}: ${errorMsg}`);
  }
}

export async function sendMessage(chatId: string, text: string) {
  if (!chatId || !text) {
    throw new Error('Chat ID and text are required');
  }

  const bot = getBot();

  try {
    return await bot.api.sendMessage(chatId, text, {
      parse_mode: 'HTML',
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to send message to Telegram chat ${chatId}: ${errorMsg}`);
  }
}
