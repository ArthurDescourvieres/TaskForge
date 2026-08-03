import { useEffect, useState } from 'react';
import { createTicket, getTickets, getUsers } from './api';
import { TicketForm } from './TicketForm';
import { TicketList } from './TicketList';
import type { CreateTicketInput, Ticket, User } from './types';
import './App.css';

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getTickets(), getUsers()])
      .then(([ticketsData, usersData]) => {
        setTickets(ticketsData);
        setUsers(usersData);
      })
      .catch(() => setError("Impossible de contacter l'API."));
  }, []);

  async function handleCreate(input: CreateTicketInput) {
    const ticket = await createTicket(input);
    setTickets((prev) => [ticket, ...prev]);
  }

  return (
    <div className="app">
      <h1>TaskForge — Tickets</h1>

      {error && <p className="error">{error}</p>}

      <TicketForm users={users} onCreate={handleCreate} />
      <TicketList tickets={tickets} />
    </div>
  );
}

export default App;
