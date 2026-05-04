import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Send, MessageSquare, Users, Hash } from 'lucide-react';
import moment from 'moment';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Chat() {
  const { user } = useOutletContext();
  const [activeConvo, setActiveConvo] = useState(null);
  const [msgText, setMsgText] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatUser, setNewChatUser] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: () => base44.entities.Conversation.list('-last_message_at', 50),
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', activeConvo?.id],
    queryFn: () => activeConvo ? base44.entities.Message.filter({ conversation_id: activeConvo.id }, 'created_date', 100) : [],
    enabled: !!activeConvo,
    refetchInterval: 5000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['chat-users'],
    queryFn: () => base44.entities.User.list('full_name', 200),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      await base44.entities.Message.create({
        conversation_id: activeConvo.id,
        sender_email: user.email,
        sender_name: user.full_name,
        content,
      });
      await base44.entities.Conversation.update(activeConvo.id, {
        last_message: content,
        last_message_at: new Date().toISOString(),
        last_message_by: user.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeConvo?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMsgText('');
    },
  });

  const createConvoMutation = useMutation({
    mutationFn: async () => {
      const targetUser = allUsers.find(u => u.email === newChatUser);
      return base44.entities.Conversation.create({
        type: 'direct',
        participants: [user.email, newChatUser],
        title: targetUser?.full_name || newChatUser,
      });
    },
    onSuccess: (convo) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConvo(convo);
      setNewChatOpen(false);
      setNewChatUser('');
    },
  });

  const handleSend = () => {
    if (!msgText.trim()) return;
    sendMutation.mutate(msgText.trim());
  };

  const getConvoTitle = (convo) => {
    if (convo.title) return convo.title;
    const other = convo.participants?.find(p => p !== user?.email);
    const otherUser = allUsers.find(u => u.email === other);
    return otherUser?.full_name || other || 'Chat';
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] bg-card rounded-xl border border-border overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r border-border flex flex-col",
        activeConvo ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Messages</h2>
          <Button size="icon" variant="ghost" onClick={() => setNewChatOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map(convo => (
              <button
                key={convo.id}
                onClick={() => setActiveConvo(convo)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                  activeConvo?.id === convo.id ? "bg-primary/10" : "hover:bg-accent"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {convo.type === 'group' ? (
                    <Users className="h-4 w-4 text-primary" />
                  ) : (
                    <span className="text-primary font-semibold text-xs">
                      {getConvoTitle(convo).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{getConvoTitle(convo)}</p>
                  {convo.last_message && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{convo.last_message}</p>
                  )}
                </div>
                {convo.last_message_at && (
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {moment(convo.last_message_at).fromNow(true)}
                  </span>
                )}
              </button>
            ))}
            {conversations.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No conversations yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !activeConvo ? "hidden md:flex" : "flex"
      )}>
        {activeConvo ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setActiveConvo(null)}>← Back</Button>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold text-xs">
                  {getConvoTitle(activeConvo).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <p className="font-semibold text-sm">{getConvoTitle(activeConvo)}</p>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map(msg => {
                  const isMe = msg.sender_email === user?.email;
                  return (
                    <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5",
                        isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-accent rounded-bl-md"
                      )}>
                        {!isMe && <p className="text-xs font-medium mb-1 opacity-70">{msg.sender_name}</p>}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={cn("text-[10px] mt-1", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>
                          {moment(msg.created_date).format('h:mm A')}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!msgText.trim() || sendMutation.isPending} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Person</Label>
              <Select value={newChatUser} onValueChange={setNewChatUser}>
                <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                <SelectContent>
                  {allUsers.filter(u => u.email !== user?.email).map(u => (
                    <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewChatOpen(false)}>Cancel</Button>
            <Button onClick={() => createConvoMutation.mutate()} disabled={!newChatUser || createConvoMutation.isPending}>
              Start Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}