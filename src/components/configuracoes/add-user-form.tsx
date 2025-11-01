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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

// NOTA: A criação de usuários com email/senha deve ser feita em um ambiente seguro (backend/Cloud Function).
// Este formulário cria apenas o perfil do usuário no Firestore. O admin precisaria criar o usuário no Firebase Auth Console.
// Para uma solução completa, seria necessário um backend para gerenciar a criação de usuários no Firebase Auth.

const formSchema = z.object({
  displayName: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('Formato de e-mail inválido.'),
  role: z.enum(['admin', 'recepcionista', 'mecanico']),
});

type AddUserFormProps = {
  setDialogOpen: (open: boolean) => void;
};

export function AddUserForm({ setDialogOpen }: AddUserFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      role: 'recepcionista',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    try {
      // ATENÇÃO: Esta é uma abordagem simplificada. O ideal é usar o UID do Firebase Auth.
      // Como estamos em um ambiente client-side, vamos usar o email como ID temporário
      // e o administrador deve garantir a criação do usuário no Firebase Auth Console.
      const usersCollectionRef = collection(firestore, 'users');
      // Usar um ID gerado automaticamente pelo Firestore
      const newUserDocRef = doc(usersCollectionRef);

      const userData = {
        ...values,
        uid: newUserDocRef.id, // Usando o ID do documento como UID
        disabled: false,
      };

      await addDocumentNonBlocking(newUserDocRef, userData);

      toast({
        title: 'Sucesso!',
        description: 'Perfil de usuário criado. Lembre-se de criar a conta de autenticação no Firebase Console.',
      });
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error adding user profile: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível criar o perfil do usuário. Tente novamente.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do funcionário" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email de Acesso</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função do usuário" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="recepcionista">Recepcionista</SelectItem>
                  <SelectItem value="mecanico">Mecânico</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
