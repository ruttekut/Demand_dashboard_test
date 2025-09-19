import { EventEmitter } from '../utils/EventEmitter';
import { ChatMessage } from '../types';
import { chatMessages, providerChats } from '../mocks/data';

export type SocketEvents = {
  message: { chatId: string; message: ChatMessage };
  typing: { chatId: string; providerId: string };
};

class MockSocket extends EventEmitter<SocketEvents> {
  private replyTimer?: number;

  connect() {
    if (this.replyTimer) return;
    this.replyTimer = window.setInterval(() => {
      const chat = providerChats[Math.floor(Math.random() * providerChats.length)];
      if (!chat) return;
      const message: ChatMessage = {
        id: `msg-${chatMessages.length + 1}`,
        chatId: chat.id,
        author: 'provider',
        text: 'Thanks for the update! We will review and respond shortly.',
        createdAt: new Date().toISOString()
      };
      chatMessages.push(message);
      this.emit('message', { chatId: chat.id, message });
    }, 45_000);
  }

  disconnect() {
    if (this.replyTimer) {
      window.clearInterval(this.replyTimer);
      this.replyTimer = undefined;
    }
  }
}

export const socket = new MockSocket();

export function simulateProviderTyping(chatId: string, providerId: string) {
  socket.emit('typing', { chatId, providerId });
}
