import { useState } from "react";
import { motion } from "framer-motion";

const Comment = ({ comment, onDelete, onReply }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleReplySubmit = () => {
    onReply(replyText); // Passing replyText to the onReply handler
    setReplyText("");
    setIsReplying(false);
  };

  return (
    <motion.div 
      className="p-4 border-b border-gray-300"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.4 }}
    >
      <p className="text-gray-700">{comment.comment_text}</p>
      <div className="flex gap-2">
        <motion.button 
          onClick={() => setIsReplying(!isReplying)} 
          className="text-blue-500 text-sm hover:text-blue-600"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Reply
        </motion.button>
        <motion.button 
          onClick={onDelete} 
          className="text-red-500 text-sm hover:text-red-600"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Delete
        </motion.button>
      </div>
      {isReplying && (
        <div className="mt-2">
          <textarea
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <motion.button 
            onClick={handleReplySubmit}
            className="mt-2 text-blue-500 hover:text-blue-600"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            Submit Reply
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default Comment;
