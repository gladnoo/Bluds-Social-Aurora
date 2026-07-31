import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { motion } from "framer-motion";
import { getCroppedImageFile } from "../lib/cropImage.js";
import { IconX, IconCheck } from "./Icons.jsx";

// Modal genérico de recorte/reposicionamento de imagem.
// aspect: 1 pra avatar (círculo), 3 pra banner (faixa larga).
// shape: "round" ou "rect" — só muda a máscara visual do cropper.
export default function ImageCropModal({ imageSrc, aspect = 1, shape = "rect", fileName, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_, areaPixels) => setCroppedAreaPixels(areaPixels), []);

  async function handleConfirm() {
    if (!croppedAreaPixels || busy) return;
    setBusy(true);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels, fileName);
      onConfirm(file);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-mist/85 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-mist-surface border border-mist-border rounded-3xl w-full max-w-md overflow-hidden shadow-card"
      >
        <div className="flex justify-between items-center p-4 border-b border-mist-border">
          <button onClick={onCancel} className="text-hush hover:text-ghost p-1.5 rounded-full">
            <IconX size={18} />
          </button>
          <span className="text-hush text-sm font-medium">Ajustar imagem</span>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="text-aurora-soft hover:text-aurora disabled:opacity-40 p-1.5 rounded-full"
          >
            <IconCheck size={18} />
          </button>
        </div>

        <div className="relative w-full h-72 bg-mist">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={shape}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="p-4">
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-aurora"
          />
          <p className="text-hush text-xs text-center mt-1">Arraste pra reposicionar · deslize pra dar zoom</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
