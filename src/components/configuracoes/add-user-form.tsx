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
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';


const formSchema = z.object({
  displayName: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('Formato de e-mail inválido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  role: z.enum(['admin', 'recepcionista', 'mecanico']),
});

type AddUserFormProps = {
  setDialogOpen: (open: boolean) => void;
};

export function AddUserForm({ setDialogOpen }: AddUserFormProps) {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      role: 'recepcionista',
    },
  });

  const createUserProfile = (uid: string, data: Omit<z.infer<typeof formSchema>, 'password'>) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', uid);
    const userData = {
      uid: uid,
      displayName: data.displayName,
      email: data.email,
      role: data.role,
      disabled: false,
    };
    
    setDoc(userDocRef, userData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'create',
            requestResourceData: userData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !auth) return;

    form.clearErrors();

    try {
      // 1. Tenta criar o usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. Cria o perfil do usuário no Firestore (de forma não-bloqueante)
      createUserProfile(user.uid, values);

      toast({
        title: 'Sucesso!',
        description: 'Usuário criado com sucesso.',
      });
      form.reset();
      setDialogOpen(false);

    } catch (error: any) {
        let description = 'Não foi possível criar o usuário. Tente novamente.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'Este e-mail já pertence a uma conta. Verifique a lista de usuários.';
            toast({ variant: 'destructive', title: 'Erro', description });
        } else {
             toast({ variant: 'destructive', title: 'Erro de Autenticação', description });
        }
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
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
