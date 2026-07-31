import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { resolveImageUrl } from "../lib/media.js";
import { IconX, IconArrowLeft } from "./Icons.jsx";

// Visualizador de imagem em tela cheia, com navegação entre múltiplas imagens.
export default function Lightbox({ images, index, onClose, onNavigate }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < images.length - 1) onNavigate(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [index, images.length]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full">
          <IconX size={22} />
        </button>

        {images.length > 1 && index > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(index - 1);
            }}
            className="absolute left-4 text-white/80 hover:text-white p-2 rounded-full bg-black/30"
          >
            <IconArrowLeft size={20} />
          </button>
        )}
        {images.length > 1 && index < images.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(index + 1);
            }}
            className="absolute right-4 text-white/80 hover:text-white p-2 rounded-full bg-black/30 rotate-180"
          >
            <IconArrowLeft size={20} />
          </button>
        )}

        <motion.img
          key={index}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          src={resolveImageUrl(images[index])}
          alt=""
          onClick={(e) => e.stopPropagation()}
          className="max-w-full max-h-full rounded-lg object-contain"
        />

        {images.length > 1 && (
          <div className="absolute bottom-4 text-white/70 text-sm">
            {index + 1} / {images.length}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
