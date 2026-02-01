import { CartItem, Product } from '@/types';
import { useCallback, useEffect, useState } from 'react';

const CART_KEY = 'pos_cart';

export function useCart() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(CART_KEY);
        if (stored) {
            try {
                setItems(JSON.parse(stored));
            } catch {
                setItems([]);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(CART_KEY, JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addToCart = useCallback((product: Product) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.product_id === product.id);
            if (existing) {
                return prev.map((item) => (item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
            }
            return [
                ...prev,
                {
                    product_id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    quantity: 1,
                    image_url: product.image_url,
                },
            ];
        });
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        if (quantity <= 0) {
            setItems((prev) => prev.filter((item) => item.product_id !== productId));
        } else {
            setItems((prev) => prev.map((item) => (item.product_id === productId ? { ...item, quantity } : item)));
        }
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        setItems((prev) => prev.filter((item) => item.product_id !== productId));
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        totalItems,
        isLoaded,
    };
}
