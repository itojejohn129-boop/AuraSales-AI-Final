"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Get base URL from environment
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Lock,
  Globe,
  ThumbsUp,
  AtSign,
  X,
  Loader,
} from "lucide-react";
import {
  Comment,
  MentionSuggestion,
  CommentCreateRequest,
  ChatCollaborationRequest,
  AuraAnalystResponse,
  ChartContextType,
} from "@/types/comments";
import { toast } from "sonner";

interface CommentThreadProps {
  chartContext: ChartContextType | string;
  chartTitle: string;
  chartData?: Record<string, any>;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentThread({
  chartContext,
  chartTitle,
  chartData,
  isOpen,
  onClose,
}: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [inputText, setInputText] = useState("");
  const [isInternalOnly, setIsInternalOnly] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<
    MentionSuggestion[]
  >([]);
  const [teamMembers, setTeamMembers] = useState<MentionSuggestion[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [selectedMentions, setSelectedMentions] = useState<Set<string>>(
    new Set()
  );
  const [auraIsAnalyzing, setAuraIsAnalyzing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mentionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest comment
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments, auraIsAnalyzing]);

  // Load comments when component opens
  useEffect(() => {
    if (isOpen) {
      fetchComments();
      fetchTeamMembers();
    }
  }, [isOpen, chartContext]);

  // Fetch team members for mention suggestions
  const fetchTeamMembers = async () => {
    setIsFetchingMembers(true);
    try {
      const response = await fetch(`${baseUrl}/api/team/members`, {
        method: "GET",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      setTeamMembers(data.members || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
      // Fall back to Aura AI only
      setTeamMembers([
        {
          id: "aura",
          type: "ai",
          name: "Aura AI",
          is_aura: true,
        },
      ]);
    } finally {
      setIsFetchingMembers(false);
    }
  };

  // Load team members for mention suggestions
  const handleMentionTrigger = useCallback((text: string) => {
    // Find the last @ symbol and check if we're in mention mode
    const atIndex = text.lastIndexOf("@");
    if (atIndex === -1 || (atIndex > 0 && text[atIndex - 1] !== " " && text[atIndex - 1] !== "\n")) {
      setShowMentions(false);
      return;
    }

    const afterAt = text.substring(atIndex + 1);
    const query = afterAt.split(/[\s,]/)[0].toLowerCase();

    if (query.length === 0) {
      // Show all team members
      setMentionSuggestions(teamMembers);
      setShowMentions(true);
    } else {
      // Filter suggestions by query
      const filtered = teamMembers.filter((s) =>
        s.name.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query)
      );

      if (filtered.length > 0 || query.length > 0) {
        setMentionSuggestions(filtered);
        setShowMentions(true);
      }
    }
  }, [teamMembers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    handleMentionTrigger(text);
  };

  const insertMention = (suggestion: MentionSuggestion) => {
    const atIndex = inputText.lastIndexOf("@");
    const beforeAt = inputText.substring(0, atIndex);
    const afterAt = inputText.substring(atIndex + 1);
    const afterWord = afterAt.split(/[\s,]/)[0];
    const remainder = afterAt.substring(afterWord.length);

    const mention = suggestion.is_aura ? "@Aura" : `@${suggestion.name}`;
    const newText = beforeAt + mention + remainder;

    setInputText(newText + " ");
    setSelectedMentions((prev) => new Set(prev).add(suggestion.id));
    setShowMentions(false);

    // Focus back on input
    inputRef.current?.focus();
  };

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${baseUrl}/api/comments?chart_context=${chartContext}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!inputText.trim()) return;

    setIsSubmitting(true);
    const hasAuraMention = selectedMentions.has("aura");

    try {
      // Create comment
      const commentRequest: CommentCreateRequest = {
        text: inputText,
        chart_context: chartContext as string,
        is_internal_only: isInternalOnly,
        parent_id: replyingTo || undefined,
        mentions: Array.from(selectedMentions),
      };

      const response = await fetch(`${baseUrl}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentRequest),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      const newComment = await response.json();
      setComments((prev) => [...prev, newComment]);
      setInputText("");
      setSelectedMentions(new Set());
      setReplyingTo(null);

      toast.success("Comment posted!");

      // If Aura was mentioned and not internal-only, trigger AI response
      if (hasAuraMention && !isInternalOnly) {
        triggerAuraAnalysis(newComment, inputText);
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerAuraAnalysis = async (
    comment: Comment,
    text: string
  ) => {
    setAuraIsAnalyzing(true);

    try {
      const collaborationRequest: ChatCollaborationRequest = {
        comment_text: text,
        chart_context: chartContext as string,
        chart_data: chartData,
        user_name: comment.author?.full_name || "Team Member",
        previous_messages: [],
      };

      const response = await fetch(`${baseUrl}/api/chat/collaboration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collaborationRequest),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 402) {
          window.location.href = errorData?.redirectTo || "/pricing?payment=required";
          return;
        }
        throw new Error(`Server responded with ${response.status}: ${errorData?.error || "Unknown error"}`);
      }
      const aiResponse: AuraAnalystResponse = await response.json();

      // Create AI response comment
      const aiCommentRequest: CommentCreateRequest = {
        text: aiResponse.response,
        parent_id: comment.id,
        chart_context: chartContext as string,
        is_internal_only: false,
      };

      const createResponse = await fetch(`${baseUrl}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiCommentRequest),
      });
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Server responded with ${createResponse.status}: ${errorText}`);
      }
      const aiComment = await createResponse.json();
      setComments((prev) => [...prev, aiComment]);

      toast.success("Aura AI has analyzed your question!");
    } catch (error) {
      console.error("Error getting Aura analysis:", error);
      toast.error("Failed to get AI analysis");
    } finally {
      setAuraIsAnalyzing(false);
    }
  };

  const handleReact = async (commentId: string, reactionType: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/comments/${commentId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction_type: reactionType }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      // Update local state
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, likes_count: (c.likes_count || 0) + 1 }
            : c
        )
      );
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed right-0 top-0 h-screen w-96 bg-slate-800/95 border-l border-slate-700 shadow-2xl flex flex-col z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-sm font-semibold text-slate-50">War Room</h2>
            <p className="text-xs text-slate-400">{chartTitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Comments area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-5 h-5 text-blue-400 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-slate-400 text-sm mt-8">
            No comments yet. Start the discussion!
          </div>
        ) : (
          comments.map((comment) => (
            <motion.div
              key={comment.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg border ${
                comment.is_ai_response
                  ? "bg-blue-900/20 border-blue-700/30"
                  : "bg-slate-700/30 border-slate-600/30"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {comment.author?.full_name?.charAt(0) || "A"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-100">
                      {comment.is_ai_response ? "🤖 Aura AI" : comment.author?.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(comment.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {comment.is_internal_only && (
                  <Lock className="w-3 h-3 text-yellow-400" />
                )}
              </div>

              <p className="text-sm text-slate-200 mb-2">{comment.text}</p>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => handleReact(comment.id, "like")}
                  className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>{comment.likes_count || 0}</span>
                </button>
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-slate-400 hover:text-blue-400 transition-colors"
                >
                  Reply
                </button>
              </div>
            </motion.div>
          ))
        )}

        {auraIsAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-blue-900/20 border border-blue-700/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-xs text-white font-bold">🤖</span>
              </div>
              <p className="text-sm text-blue-300 animate-pulse flex items-center gap-2">
                <Loader className="w-3 h-3 animate-spin" />
                Aura is analyzing...
              </p>
            </div>
          </motion.div>
        )}

        <div ref={commentsEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-slate-700 p-4 space-y-2">
        {/* Mention suggestions */}
        <AnimatePresence>
          {showMentions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-700 rounded-lg border border-slate-600 max-h-40 overflow-y-auto"
            >
              {mentionSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => insertMention(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                  <span className="text-xl">
                    {suggestion.is_aura ? "🤖" : "👤"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-100 truncate">
                      {suggestion.name}
                    </p>
                    {suggestion.email && (
                      <p className="text-xs text-slate-400 truncate">
                        {suggestion.email}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reply indicator */}
        {replyingTo && (
          <div className="text-xs text-blue-400 flex items-center justify-between">
            <span>Replying to comment...</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input field */}
        <div className="relative">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type @ to mention someone or Aura AI..."
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          {inputText.includes("@") && (
            <AtSign className="absolute right-2 top-2 w-4 h-4 text-blue-400" />
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInternalOnly(!isInternalOnly)}
              title={
                isInternalOnly
                  ? "Internal only (Aura can't see this)"
                  : "Visible to Aura AI"
              }
              className={`p-2 rounded transition-colors ${
                isInternalOnly
                  ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/50"
                  : "bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:bg-slate-600/30"
              }`}
            >
              {isInternalOnly ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            onClick={handleSubmitComment}
            disabled={!inputText.trim() || isSubmitting}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            {isSubmitting ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
          </button>
        </div>
      </div>
    </motion.div>
  );
}
