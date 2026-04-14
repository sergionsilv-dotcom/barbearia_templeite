import React, { useState, useEffect } from 'react';
import { firebaseUtils } from '../../lib/firebaseUtils';
import { Product, Expense } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { toast } from 'sonner';
import { Package, Plus, Search, AlertTriangle, TrendingUp, ShoppingCart, ArrowUpRight } from 'lucide-react';
import { Badge } from '../ui/badge';

import { useLocationContext } from '../../LocationContext';

export const InventoryTab: React.FC = () => {
  const { activeBranchId, activeBranch } = useLocationContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states for new product
  const [newProduct, setNewProduct] = useState({
    name: '',
    salePrice: 0,
    costPrice: 0,
    currentStock: 0,
    minStock: 5,
    sku: '',
    description: ''
  });

  // Form state for adding stock
  const [stockEntry, setStockEntry] = useState({
    quantity: 0,
    totalCost: 0
  });

  useEffect(() => {
    const unsub = firebaseUtils.subscribeToCollection<Product>('products', [], (data) => {
      const isAll = activeBranchId === 'all';
      setProducts(data.filter(p => isAll || !activeBranchId || p.locationId === activeBranchId || (!p.locationId && activeBranch?.isMain)));
      setLoading(false);
    });
    return unsub;
  }, [activeBranchId, activeBranch]);

  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.salePrice <= 0) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    try {
      await firebaseUtils.addDocument('products', {
        ...newProduct,
        locationId: activeBranchId === 'all' ? '' : activeBranchId,
        createdAt: new Date().toISOString()
      });
      toast.success('Produto cadastrado com sucesso!');
      setIsAddProductOpen(false);
      setNewProduct({ name: '', salePrice: 0, costPrice: 0, currentStock: 0, minStock: 5, sku: '', description: '' });
    } catch {
      toast.error('Erro ao cadastrar produto.');
    }
  };

  const handleAddStock = async () => {
    if (!selectedProduct || stockEntry.quantity <= 0) return;

    try {
      // 1. Update stock in products collection
      const newStock = (selectedProduct.currentStock || 0) + stockEntry.quantity;
      await firebaseUtils.updateDocument('products', selectedProduct.id, {
        currentStock: newStock
      });

      // 2. Automatically create an expense for the purchase
      if (stockEntry.totalCost > 0) {
        const expense: Omit<Expense, 'id'> = {
          date: new Date().toISOString(),
          categoryId: 'purchase', // Default category for stock
          categoryName: 'Compra de Produtos',
          amount: stockEntry.totalCost,
          description: `Compra de ${stockEntry.quantity}x ${selectedProduct.name}`,
          type: 'expense',
          paymentMethod: 'local',
          locationId: selectedProduct.locationId || activeBranchId,
          createdAt: new Date().toISOString()
        };
        await firebaseUtils.addDocument('expenses', expense);
      }

      toast.success(`Estoque atualizado! ${stockEntry.quantity} unidades adicionadas.`);
      setIsAddStockOpen(false);
      setStockEntry({ quantity: 0, totalCost: 0 });
    } catch {
      toast.error('Erro ao atualizar estoque.');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = products.filter(p => p.currentStock <= p.minStock).length;

  if (loading) return <div className="text-center py-10">Carregando estoque...</div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/[0.02] border-white/10 rounded-none">
          <CardHeader className="py-4 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-white/20" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-black italic">{products.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/[0.02] border-white/10 rounded-none border-l-amber-500/50">
          <CardHeader className="py-4 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500/50" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-black italic text-amber-500">{lowStockCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10 rounded-none">
          <CardHeader className="py-4 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Valor em Estoque (Venda)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500/20" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-black italic text-green-500">
              R$ {products.reduce((acc, p) => acc + (p.salePrice * p.currentStock), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Buscar produto..." 
            className="pl-10 bg-white/5 border-white/10 rounded-none uppercase tracking-widest text-[10px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 rounded-none uppercase tracking-widest text-[10px] font-bold px-6">
              <Plus className="h-4 w-4 mr-2" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-white/10 rounded-none max-w-md">
            <DialogHeader>
              <DialogTitle className="uppercase italic font-black tracking-tighter text-2xl">Cadastrar Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Nome do Produto</Label>
                <Input 
                  className="bg-black border-white/10 rounded-none" 
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Código / SKU</Label>
                <Input 
                  placeholder="Ex: PRD-001"
                  className="bg-black border-white/10 rounded-none uppercase" 
                  value={newProduct.sku}
                  onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Preço de Venda (R$)</Label>
                  <Input 
                    type="number" 
                    className="bg-black border-white/10 rounded-none"
                    value={newProduct.salePrice}
                    onChange={e => setNewProduct({...newProduct, salePrice: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Preço de Custo (R$)</Label>
                  <Input 
                    type="number" 
                    className="bg-black border-white/10 rounded-none"
                    value={newProduct.costPrice}
                    onChange={e => setNewProduct({...newProduct, costPrice: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              
              {/* Margin Preview */}
              {newProduct.salePrice > 0 && newProduct.costPrice > 0 && (
                <div className="p-3 bg-green-500/5 border border-green-500/10 flex justify-between items-center">
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-green-500 font-bold">Margem Estimada</p>
                    <p className="text-xs font-black italic text-green-400">R$ {(newProduct.salePrice - newProduct.costPrice).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] uppercase tracking-widest text-green-500 font-bold">ROI</p>
                    <p className="text-xs font-black italic text-green-400">{(((newProduct.salePrice - newProduct.costPrice) / newProduct.salePrice) * 100).toFixed(0)}%</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Estoque Inicial</Label>
                  <Input 
                    type="number" 
                    className="bg-black border-white/10 rounded-none"
                    value={newProduct.currentStock}
                    onChange={e => setNewProduct({...newProduct, currentStock: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Alerta (Mínimo)</Label>
                  <Input 
                    type="number" 
                    className="bg-black border-white/10 rounded-none"
                    value={newProduct.minStock}
                    onChange={e => setNewProduct({...newProduct, minStock: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddProduct}
                className="w-full bg-amber-600 hover:bg-amber-700 rounded-none uppercase tracking-widest font-bold py-6"
              >
                Salvar Produto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      <div className="bg-white/[0.02] border border-white/10 rounded-none overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10">
            <tr className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">
              <th className="px-6 py-4 text-[10px]">Código</th>
              <th className="px-6 py-4">Produto</th>
              {activeBranchId === 'all' && <th className="px-6 py-4">Unidade</th>}
              <th className="px-6 py-4">Estoque</th>
              <th className="px-6 py-4">Margem</th>
              <th className="px-6 py-4">P. Venda</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="group hover:bg-white/[0.02] transition-colors">
               <td className="px-6 py-4">
                  <Badge variant="outline" className="text-[9px] border-white/10 bg-white/5 text-gray-500 rounded-none uppercase font-mono">
                    {product.sku || 'N/A'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold uppercase tracking-widest text-sm">{product.name}</div>
                  <div className="text-[10px] text-gray-600 mt-1 uppercase flex items-center">
                    Custo: <span className="text-white/40 ml-1">R$ {product.costPrice.toFixed(2)}</span>
                  </div>
                </td>
                {activeBranchId === 'all' && (
                  <td className="px-6 py-4">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                      {product.locationId ? 'Filial' : 'Matriz'}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-black italic ${product.currentStock <= product.minStock ? 'text-amber-500' : 'text-white'}`}>
                      {product.currentStock}
                    </span>
                    {product.currentStock <= product.minStock && (
                      <Badge variant="outline" className="text-[8px] bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-none uppercase font-black px-1.5 py-0">
                        Baixo
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs font-black italic text-green-400">
                    R$ {(product.salePrice - product.costPrice).toFixed(2)}
                  </div>
                  <div className="text-[9px] text-green-500/50 uppercase font-bold">
                    {(((product.salePrice - product.costPrice) / product.salePrice) * 100).toFixed(0)}% Profit
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-white">R$ {product.salePrice.toFixed(2)}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-white/10 rounded-none text-[10px] uppercase font-bold hover:bg-white/5 h-8"
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsAddStockOpen(true);
                    }}
                  >
                    <ShoppingCart className="h-3 w-3 mr-2 text-amber-500" /> Adquirir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Stock Dialog */}
      <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 rounded-none max-w-sm">
          <DialogHeader>
            <DialogTitle className="uppercase italic font-black tracking-tighter text-2xl flex items-center">
              <ArrowUpRight className="h-6 w-6 mr-2 text-amber-500" /> Registrar Compra
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-white/5 border border-white/10 rounded-none">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Produto Selecionado</p>
              <p className="text-sm font-bold uppercase tracking-widest text-white">{selectedProduct?.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Quantidade Comprada</Label>
              <Input 
                type="number"
                className="bg-black border-white/10 rounded-none"
                value={stockEntry.quantity}
                onChange={e => setStockEntry({...stockEntry, quantity: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Custo Total da Compra (R$)</Label>
              <Input 
                type="number"
                className="bg-black border-white/10 rounded-none font-bold text-amber-500"
                value={stockEntry.totalCost}
                onChange={e => setStockEntry({...stockEntry, totalCost: parseFloat(e.target.value)})}
              />
              <p className="text-[9px] text-gray-500 uppercase tracking-widest italic pt-1">
                * Este valor será lançado como uma despesa automaticamente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleAddStock}
              className="w-full bg-amber-600 hover:bg-amber-700 rounded-none uppercase tracking-widest font-bold py-6"
            >
              Confirmar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
