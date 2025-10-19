import { jsx as _jsx } from "react/jsx-runtime";
export default function Card({ faceUp, image, label }) {
    return (_jsx("div", { style: { width: 120, height: 170, perspective: 800 }, children: _jsx("div", { style: {
                width: '100%',
                height: '100%',
                borderRadius: 8,
                boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
                transformStyle: 'preserve-3d',
                position: 'relative',
            }, children: faceUp ? (_jsx("img", { src: image, alt: label, style: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 } })) : (_jsx("div", { style: {
                    width: '100%',
                    height: '100%',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg,#222,#111)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                }, children: "CARD" })) }) }));
}
