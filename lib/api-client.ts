export interface ApiUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  avatarUrl: string;
  isOnline: boolean;
  statusText?: string;
  statusEmoji?: string;
  role?: string;
}

export interface ApiChat {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatarUrl: string;
  tag?: string;
  roleBadge?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  isTyping?: boolean;
  typingText?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isPinned?: boolean;
  participants: string[];
}

export interface ApiMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'code' | 'file';
  mediaUrl?: string;
  mediaMeta?: {
    name?: string;
    size?: string;
    duration?: string;
    waveform?: number[];
  };
  reactions?: Record<string, number>;
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  timestamp: string;
  isSelf?: boolean;
}

export interface ApiStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  caption: string;
  timestamp: string;
  viewed: boolean;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('nexus_auth_token');
  }

  private setToken(token: string | null) {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem('nexus_auth_token', token);
    } else {
      localStorage.removeItem('nexus_auth_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
  }

  // Auth Endpoints
  async register(params: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    avatarUrl?: string;
  }): Promise<{ success: boolean; token: string; user: ApiUser }> {
    const res = await this.request<{ success: boolean; token: string; user: ApiUser }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async login(params: {
    identifier: string;
    password: string;
  }): Promise<{ success: boolean; token: string; user: ApiUser }> {
    const res = await this.request<{ success: boolean; token: string; user: ApiUser }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async getMe(): Promise<{ success: boolean; user: ApiUser }> {
    return this.request<{ success: boolean; user: ApiUser }>('/api/auth/me');
  }

  async logout(): Promise<{ success: boolean }> {
    this.setToken(null);
    return this.request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
  }

  // Chats Endpoints
  async getChats(filter: string = 'all', search: string = ''): Promise<{
    success: boolean;
    chats: ApiChat[];
    totalCount: number;
    unreadTotal: number;
  }> {
    const params = new URLSearchParams();
    if (filter && filter !== 'all') params.set('filter', filter);
    if (search) params.set('q', search);

    return this.request(`/api/chats?${params.toString()}`);
  }

  async getChat(id: string): Promise<{ success: boolean; chat: ApiChat; messages: ApiMessage[] }> {
    return this.request(`/api/chats/${id}`);
  }

  async sendMessage(
    chatId: string,
    payload: {
      content: string;
      type?: 'text' | 'image' | 'voice' | 'code' | 'file';
      mediaUrl?: string;
      mediaMeta?: any;
      replyTo?: any;
    }
  ): Promise<{ success: boolean; message: ApiMessage }> {
    return this.request(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async reactToMessage(chatId: string, messageId: string, emoji: string): Promise<{ success: boolean; message: ApiMessage }> {
    return this.request(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reaction', messageId, emoji }),
    });
  }

  // Stories
  async getStories(): Promise<{ success: boolean; stories: ApiStory[] }> {
    return this.request('/api/stories');
  }

  // Copilot AI
  async callCopilot(action: 'summarize' | 'prompt', query?: string): Promise<any> {
    return this.request('/api/ai/copilot', {
      method: 'POST',
      body: JSON.stringify({ action, query }),
    });
  }
}

export const api = new ApiClient();
