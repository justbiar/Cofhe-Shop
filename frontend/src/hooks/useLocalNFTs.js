import { useEffect, useState } from 'react';
export default function useLocalNFTs(tokenIds) {
    const [names, setNames] = useState({});
    const [images, setImages] = useState({});
    useEffect(() => {
        let mounted = true;
        (async () => {
            const nms = {};
            const imgs = {};
            for (const id of tokenIds) {
                try {
                    const res = await fetch(`/nfts/${id}.json`);
                    if (!res.ok)
                        continue;
                    const data = await res.json();
                    if (data) {
                        if (data.name)
                            nms[id] = String(data.name);
                        if (data.image) {
                            let img = String(data.image);
                            // ensure path is absolute to current origin if starts with '/nfts/'
                            if (img.startsWith('/'))
                                img = `${window.location.origin}${img}`;
                            imgs[id] = img;
                        }
                    }
                }
                catch (e) {
                    // ignore
                }
            }
            if (mounted) {
                setNames(nms);
                setImages(imgs);
            }
        })();
        return () => { mounted = false; };
    }, [JSON.stringify(tokenIds)]);
    return { names, images };
}
