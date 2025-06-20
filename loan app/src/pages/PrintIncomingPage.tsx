// pages/IncomingFormPage.tsx (Lengkap & Sudah Diperbaiki)

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageTitle from '../components/PageTitle';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTransactions } from '../contexts/TransactionContext';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, IncomingFormData, CreateReturnPayload } from '../types';
import { AppRoutes } from '../constants';
import { CheckCircleIcon, DocumentDuplicateIcon, PaintBrushIcon, BackspaceIcon, MinusIcon as EraserIcon, PrinterIcon } from '@heroicons/react/24/outline';

interface SuccessInfo {
  message: string;
  approvalLink: string;
  printLink: string;
}

const DrawingControls: React.FC<any> = ({ setColor, setLineWidth, setMode, clearCanvas, currentColor, currentWidth, currentMode }) => {
  const colors = [{ name: 'Red', value: '#FF0000' }, { name: 'Blue', value: '#0000FF' }, { name: 'Green', value: '#00FF00' }, { name: 'Black', value: '#000000' }];
  const widths = [{ name: 'S', value: 2 }, { name: 'M', value: 5 }, { name: 'L', value: 10 }];

  return (
    <div className="my-4 p-3 border border-gray-200 rounded-md bg-gray-50 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Color:</span>
            {colors.map(color => ( <button key={color.name} title={color.name} onClick={() => { setColor(color.value); setMode('draw'); }} className={`w-6 h-6 rounded-full border-2 ${currentColor === color.value && currentMode === 'draw' ? 'ring-2 ring-offset-1 ring-primary' : 'border-gray-300'}`} style={{ backgroundColor: color.value }} /> ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Brush:</span>
            {widths.map(width => ( <button key={width.name} onClick={() => { setLineWidth(width.value); setMode('draw'); }} className={`px-3 py-1 text-xs rounded-md border ${currentWidth === width.value && currentMode === 'draw' ? 'bg-primary text-white' : 'bg-white'}`}>{width.name}</button> ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setMode(currentMode === 'erase' ? 'draw' : 'erase')} variant={currentMode === 'erase' ? 'primary' : 'secondary'} size="sm"> {currentMode === 'erase' ? <PaintBrushIcon className="h-4 w-4 mr-1" /> : <EraserIcon className="h-4 w-4 mr-1" />} {currentMode === 'erase' ? 'Pen' : 'Eraser'} </Button>
            <Button onClick={clearCanvas} variant="danger" size="sm"><BackspaceIcon className="h-4 w-4 mr-1" />Clear Markings</Button>
        </div>
    </div>
  );
};

const IncomingFormPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const { getTransactionById, addReturnToTransaction, isLoading } = useTransactions();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<IncomingFormData>({ returnDate: new Date().toISOString().split('T')[0], returnedQuantity: 0, conditionNotes: '' });
  const [formError, setFormError] = useState<string>('');
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawConfig, setDrawConfig] = useState({ color: '#FF0000', lineWidth: 5, mode: 'draw' as 'draw' | 'erase' });
  const lastPosition = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (transactionId) {
      const tx = getTransactionById(transactionId);
      if (tx) {
        setTransaction(tx);
        const alreadyReturned = tx.returnDetails?.filter(r => r.borrowerApproved).reduce((sum, r) => sum + r.returnedQuantity, 0) || 0;
        setFormData(prev => ({ ...prev, returnedQuantity: tx.item.quantity - alreadyReturned }));
      } else {
        setFormError("Transaction not found.");
      }
    }
  }, [transactionId, getTransactionById]);
  
  useEffect(() => {
    const canvas = canvasRef.current; const image = imageRef.current; if (!canvas || !image || !transaction?.item.photoUrl) return; const ctx = canvas.getContext('2d'); if (!ctx) return; image.crossOrigin = "Anonymous"; const handleImageLoad = () => { canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; ctx.drawImage(image, 0, 0, canvas.width, canvas.height); }; image.addEventListener('load', handleImageLoad); image.src = transaction.item.photoUrl; if (image.complete) { handleImageLoad(); } return () => { image.removeEventListener('load', handleImageLoad); };
  }, [transaction]);

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text).then(() => alert('Link copied!')); };
  const getCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => { const canvas = canvasRef.current; if (!canvas) return { x: 0, y: 0 }; const rect = canvas.getBoundingClientRect(); let clientX, clientY; if ('touches' in event.nativeEvent) { clientX = event.nativeEvent.touches[0].clientX; clientY = event.nativeEvent.touches[0].clientY; } else { clientX = event.nativeEvent.clientX; clientY = event.nativeEvent.clientY; } const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height; return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }; };
  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => { event.preventDefault(); setIsDrawing(true); lastPosition.current = getCoordinates(event); };
  const stopDrawing = () => { if (isDrawing) setIsDrawing(false); };
  const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => { if (!isDrawing) return; event.preventDefault(); const canvas = canvasRef.current; const ctx = canvas?.getContext('2d'); if (!ctx || !lastPosition.current) return; const currentPos = getCoordinates(event); ctx.beginPath(); ctx.strokeStyle = drawConfig.color; ctx.lineWidth = drawConfig.lineWidth; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalCompositeOperation = drawConfig.mode === 'erase' ? 'destination-out' : 'source-over'; ctx.moveTo(lastPosition.current.x, lastPosition.current.y); ctx.lineTo(currentPos.x, currentPos.y); ctx.stroke(); lastPosition.current = currentPos; };
  const handleClearCanvas = () => { const canvas = canvasRef.current; const image = imageRef.current; if (canvas && image && image.complete) { const ctx = canvas.getContext('2d'); if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height); } } };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: name === 'returnedQuantity' ? parseInt(value) || 0 : value })); };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!user || !transaction || !transactionId) { setFormError("Data is missing."); return; }
    const remainingToReturn = transaction.item.quantity - (transaction.returnDetails?.filter(r => r.borrowerApproved).reduce((s, r) => s + r.returnedQuantity, 0) || 0);
    if (formData.returnedQuantity <= 0) { setFormError("Quantity must be > 0."); return; }
    if (formData.returnedQuantity > remainingToReturn) { setFormError(`Quantity cannot exceed remaining quantity (${remainingToReturn}).`); return; }
    
    const newReturnPayload: CreateReturnPayload = {
      returnDate: formData.returnDate,
      returnedQuantity: formData.returnedQuantity,
      conditionNotes: formData.conditionNotes,
      markedPhotoPreview: canvasRef.current?.toDataURL('image/png') || null,
      adminId: user.id,
    };
    try {
      const updatedTx = await addReturnToTransaction(transactionId, newReturnPayload);
      const latestReturn = updatedTx.returnDetails?.slice(-1)[0];
      if (latestReturn?.id) {
        const fullApprovalLink = `${window.location.origin}/#${AppRoutes.APPROVAL}/${transactionId}?type=incoming&returnId=${latestReturn.id}`;
        setSuccessInfo({
            message: `Return for transaction #${transaction.transactionNumber} has been recorded.`,
            approvalLink: fullApprovalLink,
            printLink: `${AppRoutes.PRINT_INCOMING}/${transactionId}/${latestReturn.id}`
        });
      } else {
        throw new Error("Could not get new return ID.");
      }
    } catch (error) {
      console.error(error);
      setFormError((error as Error).message);
    }
  };

  if (successInfo) {
    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <PageTitle title="Return Recorded" subtitle={successInfo.message} />
            <div className="mt-6 space-y-4">
                <p className="text-gray-600">Please provide the following approval link to the borrower:</p>
                <div className="p-3 bg-gray-100 border rounded-md text-sm text-left break-all relative">
                    <code>{successInfo.approvalLink}</code>
                    <button onClick={() => copyToClipboard(successInfo.approvalLink)} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-800" title="Copy link">
                        <DocumentDuplicateIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex justify-center gap-4 pt-4">
                    <Button variant="secondary" onClick={() => navigate(AppRoutes.DASHBOARD)}>Dashboard</Button>
                    <Link to={successInfo.printLink}><Button variant="primary"><PrinterIcon className="h-5 w-5 mr-2" />Print Page</Button></Link>
                </div>
            </div>
        </div>
    );
  }

  if (isLoading && !transaction) return <LoadingSpinner message="Loading transaction..." />;
  if (!transaction) return <PageTitle title="Error" subtitle={formError || "Transaction not found."} />;
  
  const remainingToReturn = transaction.item.quantity - (transaction.returnDetails?.filter(r => r.borrowerApproved).reduce((s, r) => s + r.returnedQuantity, 0) || 0);

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl">
      <PageTitle title="Process Item Return" subtitle={`For Transaction: ${transaction.transactionNumber}`} />
      {formError && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{formError}</p>}
      <div className="mb-6 p-4 border rounded-md bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Item Details</h3>
        <p><strong>Item:</strong> {transaction.item.description}</p>
        <p><strong>Total Borrowed Qty:</strong> {transaction.item.quantity}</p>
        <p><strong>Remaining to Return:</strong> {remainingToReturn}</p>
      </div>
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-1">Mark Item Condition on Photo:</p>
        <div className="relative border border-gray-300 rounded-md overflow-hidden mx-auto" style={{ maxWidth: '500px', touchAction: 'none' }}>
          <img ref={imageRef} alt="Item" className="hidden" />
          <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className="w-full h-auto block" />
        </div>
        <DrawingControls setColor={(c: any) => setDrawConfig(p => ({...p, color: c}))} setLineWidth={(w: any) => setDrawConfig(p => ({...p, lineWidth: w}))} setMode={(m: any) => setDrawConfig(p => ({...p, mode: m}))} clearCanvas={handleClearCanvas} currentColor={drawConfig.color} currentWidth={drawConfig.lineWidth} currentMode={drawConfig.mode} />
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="border border-gray-300 p-4 rounded-md">
          <legend className="text-lg font-semibold text-gray-700 px-2">Return Details</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <Input label="Tanggal Kembali (Return Date)" type="date" name="returnDate" value={formData.returnDate} onChange={handleChange} required />
            <Input label={`QTY Returned (Max: ${remainingToReturn})`} type="number" name="returnedQuantity" value={formData.returnedQuantity.toString()} onChange={handleChange} required min="0" max={remainingToReturn.toString()} />
            <div className="md:col-span-2">
              <Textarea label="Condition Notes" name="conditionNotes" value={formData.conditionNotes} onChange={handleChange} required placeholder="Describe item condition..." />
            </div>
          </div>
        </fieldset>
        <div className="flex justify-end pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate(AppRoutes.INCOMING_LIST)} className="mr-4">Cancel</Button>
          <Button type="submit" isLoading={isLoading} variant="primary" disabled={remainingToReturn <= 0}>
            {remainingToReturn <= 0 ? 'All Items Returned' : 'Submit Return & Get Link'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default IncomingFormPage;
