'use server'

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const CreateInvoiceSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.coerce.date(),
})

const CrateInvoiceFormSchema = CreateInvoiceSchema.omit({
  id: true,
  date: true,
})

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CrateInvoiceFormSchema.parse({
    "customerId": formData.get("customerId"),
    "amount": formData.get("amount"),
    "status": formData.get("status"),
  })

  // Transform amount to cents to avoid floating point issues
  const amountInCents = amount * 100;

  const [date] = new Date().toISOString().split('T');

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}