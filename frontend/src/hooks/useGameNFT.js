import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
// Minimal ABI fragments for ERC721 ownerOf and tokenURI
const abi = [
    {
        "constant": true,
        "inputs": [{ "name": "_tokenId", "type": "uint256" }],
        "name": "ownerOf",
        "outputs": [{ "name": "", "type": "address" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{ "name": "_tokenId", "type": "uint256" }],
        "name": "tokenURI",
        "outputs": [{ "name": "", "type": "string" }],
        "type": "function"
    }
];
export default function useGameNFT(contractAddress, tokenIds) {
    const publicClient = usePublicClient();
    const [owners, setOwners] = useState({});
    const [uris, setUris] = useState({});
    const [images, setImages] = useState({});
    const [names, setNames] = useState({});
    useEffect(() => {
        if (!contractAddress)
            return;
        let mounted = true;
        (async () => {
            try {
                const o = {};
                const u = {};
                const imgs = {};
                const nms = {};
                const normalize = (raw) => {
                    if (!raw)
                        return raw;
                    if (raw.startsWith('ipfs://'))
                        return raw.replace('ipfs://', 'https://ipfs.io/ipfs/');
                    return raw;
                };
                for (const id of tokenIds) {
                    // ownerOf
                    try {
                        const owner = await publicClient.readContract({ address: contractAddress, abi: abi, functionName: 'ownerOf', args: [BigInt(id)] });
                        o[id] = String(owner);
                    }
                    catch (e) {
                        // ignore
                    }
                    // tokenURI and optional metadata
                    try {
                        const uriRaw = await publicClient.readContract({ address: contractAddress, abi: abi, functionName: 'tokenURI', args: [BigInt(id)] });
                        const strUri = String(uriRaw);
                        u[id] = strUri;
                        const maybe = normalize(strUri);
                        let resolvedImage = '';
                        let resolvedName = '';
                        try {
                            // prefer same-origin fetch for local /nfts/ metadata to avoid CORS (vite serves public/nfts)
                            let fetchTarget = maybe;
                            try {
                                if (maybe.includes('/nfts/')) {
                                    // build same-origin path
                                    const url = new URL(maybe, window.location.href);
                                    fetchTarget = `${window.location.origin}${url.pathname}`;
                                }
                            }
                            catch (e) {
                                // ignore URL parse
                            }
                            if (maybe.endsWith('.json') || maybe.includes('/nfts/') || maybe.includes('json')) {
                                const res = await fetch(fetchTarget);
                                if (res.ok) {
                                    const data = await res.json();
                                    if (data) {
                                        if (data.image) {
                                            let img = String(data.image);
                                            img = normalize(img);
                                            try {
                                                const base = new URL(maybe);
                                                if (img.startsWith('/'))
                                                    img = `${base.origin}${img}`;
                                                else if (!img.startsWith('http'))
                                                    img = `${base.origin}/${img}`;
                                            }
                                            catch (e) {
                                                // ignore
                                            }
                                            resolvedImage = img;
                                        }
                                        if (data.name)
                                            resolvedName = String(data.name);
                                    }
                                }
                            }
                            else if (maybe.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
                                resolvedImage = maybe;
                            }
                        }
                        catch (e) {
                            // ignore metadata fetch errors
                        }
                        if (resolvedImage) {
                            imgs[id] = resolvedImage;
                            u[id] = resolvedImage;
                        }
                        else if (strUri.endsWith('.json')) {
                            // try to resolve to same-origin png
                            try {
                                const url = new URL(strUri, window.location.href);
                                u[id] = `${window.location.origin}${url.pathname.replace(/\.json$/i, '.png')}`;
                            }
                            catch (e) {
                                u[id] = strUri.replace(/\.json$/i, '.png');
                            }
                        }
                        if (resolvedName)
                            nms[id] = resolvedName;
                    }
                    catch (e) {
                        // ignore tokenURI errors
                    }
                }
                if (mounted) {
                    setOwners(o);
                    setUris(u);
                    setImages(imgs);
                    setNames(nms);
                }
            }
            catch (err) {
                // ignore
            }
        })();
        return () => { mounted = false; };
    }, [contractAddress, publicClient, JSON.stringify(tokenIds)]);
    return { owners, uris, images, names };
}
