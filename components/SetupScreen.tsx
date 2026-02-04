
import React, { useState } from 'react';
import { Icons } from './Icon';

interface SetupScreenProps {
  onComplete: (name: string, phoneNumber: string) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [ddd, setDdd] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = `+55 ${ddd} ${phone}`;
    if (name.trim().length > 0 && ddd.length >= 2 && phone.length >= 8) {
      onComplete(name.trim(), fullPhone);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers
    const value = e.target.value.replace(/\D/g, '');
    setPhone(value);
  };

  const handleDddChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 2) {
      setDdd(value);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-6 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="w-20 h-20 bg-whatsapp-teal rounded-full flex items-center justify-center mx-auto mb-6 text-white">
          <Icons.User size={40} />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Bem-vindo ao BlueChat</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Cadastre seu número para conversar offline via Bluetooth. As conversas ficam salvas neste aparelho.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Phone Input Area */}
          <div className="text-left">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Número de Telefone</label>
            <div className="flex gap-2">
              <div className="w-16 flex items-center justify-center border-b-2 border-whatsapp-teal py-2 bg-gray-50 text-gray-600 font-medium">
                BR +55
              </div>
              <input 
                type="tel"
                value={ddd}
                onChange={handleDddChange}
                placeholder="DDD"
                className="w-14 text-center px-2 py-2 border-b-2 border-whatsapp-teal outline-none focus:bg-gray-50 font-medium text-lg"
                required
              />
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="99999-9999"
                className="flex-1 px-2 py-2 border-b-2 border-whatsapp-teal outline-none focus:bg-gray-50 font-medium text-lg"
                required
              />
            </div>
          </div>

          <div className="text-left">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nome de Perfil</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whatsapp-light focus:border-transparent outline-none transition"
              placeholder="Digite seu nome"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={!name.trim() || phone.length < 8 || ddd.length < 2}
            className="w-full bg-whatsapp-teal hover:bg-whatsapp-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 mt-4"
          >
            Concluir Cadastro <Icons.Check size={18} />
          </button>
        </form>
        
        <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
           <p className="flex items-center justify-center gap-1"><Icons.Bluetooth size={12}/> Funciona sem internet</p>
           <p>Seus dados ficam salvos localmente.</p>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
