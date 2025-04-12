import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderItemWithProduct } from "@shared/schema";

export default function OrderManagement() {
  const { toast } = useToast();
  
  // 订单管理状态
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItemWithProduct[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  
  // 批量删除状态
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 订单状态显示函数
  const getStatusDisplay = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "待付款",
      paid: "已付款",
      shipped: "已发货",
      completed: "已完成",
      cancelled: "已取消"
    };
    return statusMap[status] || status;
  };
  
  // 支付方式显示函数
  const getPaymentMethodDisplay = (method: string): string => {
    const methodMap: Record<string, string> = {
      stonks: "STONKS代币",
      usdt: "USDT",
      fiat: "法币支付",
      crypto: "STONKS"  // 将crypto显示为STONKS
    };
    return methodMap[method] || method;
  };
  
  // 状态CSS类
  const getStatusClass = (status: string): string => {
    const statusClassMap: Record<string, string> = {
      pending: "px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400",
      paid: "px-2 py-1 rounded-full bg-green-500/20 text-green-400",
      shipped: "px-2 py-1 rounded-full bg-blue-500/20 text-blue-400",
      completed: "px-2 py-1 rounded-full bg-accent/20 text-accent",
      cancelled: "px-2 py-1 rounded-full bg-red-500/20 text-red-400"
    };
    return statusClassMap[status] || "px-2 py-1 rounded-full bg-gray-500/20 text-gray-400";
  };
  
  // 获取订单列表
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await apiRequest("GET", "/api/orders");
      const ordersData = await response.json();
      setOrders(ordersData);
    } catch (error) {
      console.error("获取订单列表错误:", error);
      toast({
        title: "获取订单列表失败",
        description: "无法获取订单列表，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  };
  
  // 初始加载订单
  useEffect(() => {
    fetchOrders();
  }, []);
  
  // 根据过滤条件获取订单
  const filteredOrders = orderStatusFilter === "all" 
    ? orders 
    : orders.filter(order => order.status === orderStatusFilter);
  
  // 获取订单详情
  const fetchOrderDetails = async (orderId: number) => {
    try {
      const response = await apiRequest("GET", `/api/orders/${orderId}/items`);
      const itemsData = await response.json();
      setSelectedOrderItems(itemsData);
      setShowOrderDialog(true);
    } catch (error) {
      console.error("获取订单详情错误:", error);
      toast({
        title: "获取订单详情失败",
        description: "无法获取订单详情，请稍后再试",
        variant: "destructive",
      });
    }
  };
  
  // 更新订单状态
  const handleOrderStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const response = await apiRequest("PUT", `/api/orders/${orderId}/status`, {
        status: newStatus
      });
      
      if (response.ok) {
        toast({
          title: "状态更新成功",
          description: `订单状态已更新为：${getStatusDisplay(newStatus)}`,
        });
        
        // 刷新订单列表
        await fetchOrders();
        
        // 如果正在查看该订单的详情，关闭详情对话框
        if (selectedOrder?.id === orderId) {
          setShowOrderDialog(false);
          setSelectedOrder(null);
        }
      } else {
        throw new Error("更新订单状态失败");
      }
    } catch (error) {
      console.error("更新订单状态错误:", error);
      toast({
        title: "更新订单状态失败",
        description: "无法更新订单状态，请稍后再试",
        variant: "destructive",
      });
    }
  };
  
  // 更新物流单号
  const handleTrackingNumberUpdate = async (orderId: number) => {
    if (!trackingNumber.trim()) {
      toast({
        title: "请输入物流单号",
        description: "物流单号不能为空",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await apiRequest("PUT", `/api/orders/${orderId}/tracking`, {
        trackingNumber: trackingNumber.trim()
      });
      
      if (response.ok) {
        toast({
          title: "物流单号更新成功",
          description: "订单已标记为已发货状态",
        });
        
        // 刷新订单列表
        await fetchOrders();
        
        // 关闭对话框
        setShowOrderDialog(false);
        setTrackingNumber("");
      } else {
        throw new Error("更新物流单号失败");
      }
    } catch (error) {
      console.error("更新物流单号错误:", error);
      toast({
        title: "更新物流单号失败",
        description: "无法更新物流单号，请稍后再试",
        variant: "destructive",
      });
    }
  };
  
  // 处理单个订单的复选框选择
  const handleOrderSelection = (orderId: number, isChecked: boolean) => {
    if (isChecked) {
      // 添加到选中的订单ID列表
      setSelectedOrderIds(prevSelected => [...prevSelected, orderId]);
    } else {
      // 从选中的订单ID列表中移除
      setSelectedOrderIds(prevSelected => prevSelected.filter(id => id !== orderId));
    }
  };
  
  // 处理全选/取消全选
  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      // 选中当前过滤后的所有订单
      const allOrderIds = filteredOrders.map(order => order.id);
      setSelectedOrderIds(allOrderIds);
    } else {
      // 取消所有选择
      setSelectedOrderIds([]);
    }
  };
  
  // 删除单个订单
  const handleDeleteOrder = async (orderId: number) => {
    try {
      const response = await apiRequest("DELETE", `/api/orders/${orderId}`);
      
      if (response.ok) {
        toast({
          title: "订单删除成功",
          description: `订单 #${orderId} 已成功删除`,
        });
        
        // 刷新订单列表
        await fetchOrders();
        // 清空选中状态
        setSelectedOrderIds([]);
      } else {
        throw new Error("删除订单失败");
      }
    } catch (error) {
      console.error("删除订单错误:", error);
      toast({
        title: "删除订单失败",
        description: "无法删除订单，请稍后再试",
        variant: "destructive",
      });
    }
  };
  
  // 批量删除所选订单
  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) {
      toast({
        title: "请选择要删除的订单",
        description: "您尚未选择任何订单",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const response = await apiRequest("POST", "/api/orders/bulk-delete", {
        orderIds: selectedOrderIds
      });
      
      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "批量删除成功",
          description: `成功删除 ${result.deletedCount} 个订单`,
        });
        
        // 刷新订单列表
        await fetchOrders();
        // 关闭确认对话框
        setShowDeleteConfirm(false);
        // 清空选中状态
        setSelectedOrderIds([]);
      } else {
        throw new Error("批量删除订单失败");
      }
    } catch (error) {
      console.error("批量删除订单错误:", error);
      toast({
        title: "批量删除失败",
        description: "无法批量删除订单，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="shadow-lg mb-8 bg-nightblue border border-accent/30">
      <CardHeader>
        <CardTitle>订单管理</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-between items-center">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="border-accent text-accent"
              onClick={fetchOrders}
              disabled={loadingOrders}
            >
              {loadingOrders ? "加载中..." : "刷新订单"}
            </Button>
            
            {filteredOrders.length > 0 && (
              <Button 
                variant="outline" 
                className="border-cyan-500 text-cyan-500 hover:bg-cyan-500/20"
                onClick={() => handleSelectAll(true)}
              >
                全选
              </Button>
            )}
            
            {selectedOrderIds.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  className="border-accent text-accent hover:bg-accent/20"
                  onClick={() => handleSelectAll(false)}
                >
                  取消选择
                </Button>
                
                <Button 
                  variant="destructive" 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  批量删除 ({selectedOrderIds.length})
                </Button>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="order-status-filter" className="text-sm">状态筛选:</label>
            <select
              id="order-status-filter"
              className="rounded-md p-2 bg-primary/50 border border-accent text-sm"
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              value={orderStatusFilter}
            >
              <option value="all">全部订单</option>
              <option value="pending">待付款</option>
              <option value="paid">已付款</option>
              <option value="shipped">已发货</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>

        {loadingOrders ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-primary/50">
                <TableRow>
                  <TableHead className="text-accent w-[50px]">
                    {filteredOrders.length > 0 && (
                      <Checkbox 
                        checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 border-cyan-400"
                      />
                    )}
                  </TableHead>
                  <TableHead className="text-accent">订单号</TableHead>
                  <TableHead className="text-accent">日期</TableHead>
                  <TableHead className="text-accent">总金额</TableHead>
                  <TableHead className="text-accent">支付方式</TableHead>
                  <TableHead className="text-accent">状态</TableHead>
                  <TableHead className="text-accent">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      {orderStatusFilter === 'all' ? "暂无订单记录" : `暂无${getStatusDisplay(orderStatusFilter)}订单`}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className={order.status === 'paid' && !order.trackingNumber ? "bg-yellow-900/20" : ""}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedOrderIds.includes(order.id)}
                          onCheckedChange={(checked) => handleOrderSelection(order.id, !!checked)}
                          className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 border-cyan-400"
                        />
                      </TableCell>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleString('zh-CN')}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-accent">⊙ {order.ethTotal.toFixed(6)} $STONKS</span>
                          <span className="text-xs text-gray-400">${order.total.toFixed(2)} USD</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPaymentMethodDisplay(order.paymentMethod)}</TableCell>
                      <TableCell>
                        <span className={getStatusClass(order.status)}>
                          {getStatusDisplay(order.status)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            className="text-accent hover:text-white hover:bg-primary/50"
                            onClick={() => {
                              setSelectedOrder(order);
                              fetchOrderDetails(order.id);
                            }}
                          >
                            查看详情
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-red-500 hover:text-white hover:bg-red-600/50"
                            onClick={() => handleDeleteOrder(order.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* 批量删除确认对话框 */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="bg-nightblue border border-accent">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-accent">确认批量删除</AlertDialogTitle>
              <AlertDialogDescription>
                您确定要删除选中的 {selectedOrderIds.length} 个订单吗？此操作不可撤销，删除后数据将无法恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-accent text-accent">取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? "删除中..." : "确认删除"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* 订单详情弹窗 */}
        {showOrderDialog && selectedOrder && (
          <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto bg-nightblue border border-accent">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-accent">
                  订单 #{selectedOrder.id}
                  <div className="text-sm font-normal text-gray-400 mt-1">
                    创建于 {new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-accent">订单状态</h4>
                  <div className="flex items-center gap-3">
                    <span className={getStatusClass(selectedOrder.status)}>
                      {getStatusDisplay(selectedOrder.status)}
                    </span>
                    {selectedOrder.status !== 'cancelled' && (
                      <select
                        className="rounded bg-primary/50 border border-accent p-1 text-sm"
                        value={selectedOrder.status}
                        onChange={(e) => handleOrderStatusChange(selectedOrder.id, e.target.value)}
                      >
                        <option value="pending">待付款</option>
                        <option value="paid">已付款</option>
                        <option value="shipped">已发货</option>
                        <option value="completed">已完成</option>
                        <option value="cancelled">已取消</option>
                      </select>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-accent">支付信息</h4>
                  <p>方式: {getPaymentMethodDisplay(selectedOrder.paymentMethod)}</p>
                  <div className="flex flex-col">
                    <span className="text-accent">⊙ {selectedOrder.ethTotal.toFixed(6)} $STONKS</span>
                    <span className="text-xs text-gray-400">${selectedOrder.total.toFixed(2)} USD</span>
                  </div>
                  {selectedOrder.transactionHash && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-accent">交易哈希:</p>
                      <p className="text-xs break-all bg-primary/20 p-2 rounded border border-accent/30">
                        {selectedOrder.transactionHash}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium text-accent mb-2">收货信息</h4>
                <div className="bg-primary/20 p-3 rounded border border-accent/30">
                  <p className="whitespace-pre-line">{selectedOrder.shippingAddress || '暂无收货地址'}</p>
                </div>
              </div>
              
              {selectedOrder.status === 'pending' && (
                <div className="mb-6">
                  <h4 className="font-medium text-accent mb-2">标记为已付款</h4>
                  <Button 
                    variant="outline" 
                    className="border-green-500 text-green-500 hover:bg-green-500/20"
                    onClick={() => handleOrderStatusChange(selectedOrder.id, 'paid')}
                  >
                    确认收到付款
                  </Button>
                </div>
              )}
              
              {selectedOrder.status === 'paid' && (
                <div className="mb-6">
                  <h4 className="font-medium text-accent mb-2">添加物流信息</h4>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="输入物流单号" 
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="bg-primary/50 border-accent"
                    />
                    <Button 
                      variant="outline" 
                      className="border-accent text-accent"
                      onClick={() => handleTrackingNumberUpdate(selectedOrder.id)}
                      disabled={!trackingNumber.trim()}
                    >
                      提交并发货
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedOrder.trackingNumber && (
                <div className="mb-6">
                  <h4 className="font-medium text-accent mb-2">物流单号</h4>
                  <div className="bg-primary/20 p-3 rounded border border-accent/30">
                    <p>{selectedOrder.trackingNumber}</p>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <h4 className="font-medium text-accent mb-2">订单商品</h4>
                <div className="rounded-md border border-accent/30 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-primary/50">
                      <TableRow>
                        <TableHead className="text-accent">商品</TableHead>
                        <TableHead className="text-accent">数量</TableHead>
                        <TableHead className="text-accent">单价</TableHead>
                        <TableHead className="text-accent">小计</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrderItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {item.product?.imageUrl && (
                                <div className="w-12 h-12 bg-primary/30 rounded overflow-hidden">
                                  <img 
                                    src={item.product.imageUrl} 
                                    alt={item.product?.name || '产品图片'} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <p>{item.product?.name || '未知商品'}</p>
                                {item.size && <p className="text-xs text-gray-400">尺码: {item.size}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-accent">⊙ {item.ethPrice.toFixed(6)}</span>
                              <span className="text-xs text-gray-400">${item.price.toFixed(2)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-accent">⊙ {(item.ethPrice * item.quantity).toFixed(6)}</span>
                              <span className="text-xs text-gray-400">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {selectedOrder.notes && (
                <div className="mb-6">
                  <h4 className="font-medium text-accent mb-2">订单备注</h4>
                  <div className="bg-primary/20 p-3 rounded border border-accent/30">
                    <p className="whitespace-pre-line">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}