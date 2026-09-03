import { createContext, useContext, useState, useMemo } from 'react';

const UiContext = createContext(null);

export function UiProvider({ children }) {
    const [theme, setTheme] = useState(() => localStorage.getItem('sf-theme') || 'light');
    const [masked, setMasked] = useState(false);
    const [modalState, setModalState] = useState({ open: false, editingAsset: null });
    const [assetsVersion, setAssetsVersion] = useState(0);

    const toggleTheme = () => {
        setTheme(prev => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('sf-theme', next);
            return next;
        });
    };

    const toggleMasked = () => setMasked(prev => !prev);

    const openAssetModal = (editingAsset = null) => setModalState({ open: true, editingAsset });
    const closeAssetModal = () => setModalState({ open: false, editingAsset: null });
    const bumpAssetsVersion = () => setAssetsVersion(v => v + 1);

    const value = useMemo(() => ({
        theme, masked,
        toggleTheme, toggleMasked,
        modalState, openAssetModal, closeAssetModal,
        assetsVersion, bumpAssetsVersion,
    }), [theme, masked, modalState, assetsVersion]);

    return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUi() {
    const ctx = useContext(UiContext);
    if (!ctx) throw new Error('useUi must be used within UiProvider');
    return ctx;
}
