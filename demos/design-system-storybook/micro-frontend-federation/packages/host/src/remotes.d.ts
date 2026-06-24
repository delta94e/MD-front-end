// TypeScript declarations for remote modules
declare module "remoteProducts/ProductList" {
  const ProductList: React.ComponentType<{
    onAddToCart?: (product: { id: string; name: string; price: number }) => void;
  }>;
  export default ProductList;
}

declare module "remoteCart/CartButton" {
  const CartButton: React.ComponentType;
  export default CartButton;
}
