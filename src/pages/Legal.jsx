import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, LockKeyhole } from 'lucide-react';
import AppShell from '../components/AppShell';

const documents = {
    '/termos': {
        icon: FileText,
        eyebrow: 'Transparência',
        title: 'Termos de Uso',
        intro: 'Estes termos explicam como o Crescer+ funciona e quais são os limites do conteúdo oferecido.',
        sections: [
            ['1. Sobre o Crescer+', 'O Crescer+ é uma ferramenta educativa para apoiar pais, mães, familiares e cuidadores na criação de momentos de interação com crianças de 0 a 3 anos. O uso da plataforma é opcional e deve respeitar o ritmo, o contexto e a segurança de cada criança.'],
            ['2. Conteúdo educativo', 'As atividades, descrições e sugestões têm finalidade educativa e não substituem avaliação, diagnóstico, orientação ou acompanhamento de profissionais habilitados. Em caso de dúvida sobre saúde, desenvolvimento ou segurança, procure um profissional de confiança.'],
            ['3. Responsabilidade do cuidador', 'A pessoa responsável deve permanecer próxima e supervisionar a criança durante as atividades, conferir os materiais utilizados e interromper a proposta sempre que houver desconforto, risco ou cansaço. O Crescer+ não recomenda deixar crianças pequenas sozinhas com objetos ou materiais.'],
            ['4. Conta e acesso', 'Você deve manter seus dados de acesso em segurança e informar dados verdadeiros no cadastro. Uma conta pode ser encerrada pelo próprio usuário no Perfil.'],
            ['5. Atualizações', 'Podemos atualizar o conteúdo, a interface e estes termos para melhorar a experiência. Quando uma alteração for relevante, apresentaremos a informação de forma clara no produto.'],
        ],
    },
    '/privacidade': {
        icon: LockKeyhole,
        eyebrow: 'Cuidado com seus dados',
        title: 'Política de Privacidade',
        intro: 'Esta página resume, em linguagem simples, quais dados o Crescer+ utiliza no MVP e para que eles servem.',
        sections: [
            ['1. Dados que coletamos', 'Coletamos nome, e-mail, senha protegida pelo provedor de autenticação, aceite de termos e os dados da criança informados por você, como nome, data de nascimento e foto opcional. Também registramos atividades concluídas e favoritas para exibir seu progresso.'],
            ['2. Como usamos os dados', 'Usamos esses dados para autenticar sua conta, calcular a fase aproximada de desenvolvimento, sugerir atividades, mostrar progresso, permitir favoritos e manter a segurança da plataforma. Não usamos os dados da criança para diagnóstico.'],
            ['3. Armazenamento e segurança', 'A autenticação é feita pelo Supabase Auth e os dados do produto ficam em um banco com regras de acesso. A foto opcional é armazenada em bucket privado e acessada por URL temporária. Nenhum sistema conectado à internet é absolutamente livre de riscos, por isso mantemos controles de acesso e minimização de dados.'],
            ['4. Compartilhamento', 'Não vendemos dados pessoais. O MVP utiliza serviços de infraestrutura necessários para autenticação, banco de dados e armazenamento. Não enviamos dados pessoais da criança para o serviço de geração de conteúdo; a geração administrativa trabalha com parâmetros editoriais e catálogo.'],
            ['5. Seus direitos', 'Você pode consultar e atualizar os dados disponíveis no Perfil, remover a conta e pedir orientação sobre seus dados pelo canal de contato indicado no produto. A exclusão da conta remove os registros associados conforme as regras de retenção e dependências técnicas aplicáveis.'],
        ],
    },
};

export default function Legal() {
    const location = useLocation();
    const document = documents[location.pathname] || documents['/termos'];
    const Icon = document.icon;
    return <AppShell><main className="min-h-screen px-6 pt-6 pb-12"><Link to="/cadastro" className="inline-flex items-center gap-2 h-11 rounded-full px-3 text-sm font-bold text-ink-2 hover:bg-white" aria-label="Voltar para cadastro"><ArrowLeft size={17} /> Voltar</Link><div className="mt-7 rounded-[2rem] bg-[#E4E8D5] p-6 sm:p-8 relative overflow-hidden"><div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#A8B597]/40" /><div className="relative"><div className="w-12 h-12 rounded-2xl bg-white/80 text-[#4E8B74] flex items-center justify-center"><Icon size={22} /></div><p className="mt-5 text-xs uppercase tracking-[0.18em] font-bold text-[#597363]">{document.eyebrow}</p><h1 className="mt-2 font-display text-3xl font-extrabold text-[#3F302C]">{document.title}</h1><p className="mt-3 text-sm leading-relaxed text-[#5C6A5D]">{document.intro}</p></div></div><div className="mt-7 space-y-6">{document.sections.map(([title, body]) => <section key={title}><h2 className="font-display text-lg font-bold text-ink">{title}</h2><p className="mt-2 text-sm leading-7 text-ink-2">{body}</p></section>)}</div><div className="mt-8 rounded-2xl bg-[#FDF6F0] border border-[#EADFD8] p-4 flex items-start gap-3"><ShieldCheck size={19} className="text-coral mt-0.5 flex-shrink-0" /><p className="text-sm leading-relaxed text-ink-2">Última atualização: 19 de agosto de 2026. Este texto é um resumo informativo do MVP; mantenha a política formal revisada antes de escalar o produto.</p></div><Link to="/cadastro" className="mt-7 inline-flex items-center justify-center w-full h-12 rounded-full bg-coral text-white font-bold">Voltar ao cadastro</Link></main></AppShell>;
}
