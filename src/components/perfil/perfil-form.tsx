'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useFirestore, useUser, useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { updateProfile } from 'firebase/auth';

const formSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  sobrenome: z.string().min(2, 'O sobrenome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('Formato de e-mail inválido.'),
});

type PerfilFormProps = {
  userProfile: UserProfile | null;
};

export function PerfilForm({ userProfile }: PerfilFormProps) {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      nome: userProfile?.nome || '',
      sobrenome: userProfile?.sobrenome || '',
      email: userProfile?.email || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !auth.currentUser) {
      toast({
        variant: 'destructive',
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para salvar seu perfil.',
      });
      return;
    }

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const updatedData = {
        nome: values.nome,
        sobrenome: values.sobrenome,
      };

      // We don't update email in firestore as it's coupled with auth
      await updateDocumentNonBlocking(userDocRef, updatedData);

      // Also update the display name in Firebase Auth itself
      await updateProfile(auth.currentUser, {
        displayName: `${values.nome} ${values.sobrenome}`,
      });


      toast({
        title: 'Sucesso!',
        description: 'Seu perfil foi atualizado.',
      });
    } catch (error) {
      console.error('Error saving profile: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar seu perfil. Tente novamente.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                    <Input placeholder="Seu primeiro nome" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="sobrenome"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Sobrenome</FormLabel>
                <FormControl>
                    <Input placeholder="Seu sobrenome" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
         <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input type="email" {...field} readOnly disabled />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
