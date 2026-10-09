import { Router, Request, Response } from 'express';
import { db } from '../../lib/db';
import { expressAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/chats
router.get('/', (req: Request, res: Response) => {
  const filter = (req.query.filter as string) || 'all';
  const query = (req.query.q as string)?.toLowerCase() || '';

  let chats = db.getAllChats();
  if (query) {
    chats = chats.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.lastMessage.toLowerCase().includes(query) ||
      (c.tag && c.tag.toLowerCase().includes(query))
    );
  }

  if (filter === 'unread') {
    chats = chats.filter(c => c.unreadCount > 0);
  } else if (filter === 'direct') {
    chats = chats.filter(c => c.type === 'direct');
  } else if (filter === 'groups') {
    chats = chats.filter(c => c.type === 'group');
  } else if (filter === 'pinned') {
    chats = chats.filter(c => c.isPinned);
  }

  return res.json({
    success: true,
    chats,
    totalCount: chats.length,
    unreadTotal: chats.reduce((acc, c) => acc + c.unreadCount, 0),
  });
});

// GET /api/chats/:id
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const chat = db.getChatById(id);
  if (!chat) {
    return res.status(404).json({ success: false, error: 'Chat not found' });
  }
  const messages = db.getMessagesByChatId(id);
  return res.json({ success: true, chat, messages });
});

// POST /api/chats/:id/messages
router.post('/:id/messages', (req: AuthenticatedRequest, res: Response) => {
  const { id: chatId } = req.params;
  const { content, type = 'text', mediaUrl, mediaMeta, replyTo, action, messageId, emoji } = req.body;

  if (action === 'reaction') {
    const updated = db.addReaction(chatId, messageId, emoji);
    return res.json({ success: true, message: updated });
  }

  const senderId = req.user?.userId || 'usr-1';
  const senderUser = db.findUserById(senderId);

  const newMsg = db.addMessage(chatId, {
    chatId,
    senderId,
    senderName: senderUser?.name || req.user?.name || 'Alex Thorne',
    senderAvatar: senderUser?.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA',
    content: content || 'Media Payload',
    type,
    mediaUrl,
    mediaMeta,
    replyTo,
    isSelf: true,
    reactions: {},
  });

  return res.status(201).json({ success: true, message: newMsg });
});

export default router;
