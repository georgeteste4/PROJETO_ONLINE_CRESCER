import { supabase } from './supabase';

const DEFAULT_DISCLAIMER = 'Conteúdo educativo, não substitui avaliação profissional.';
const DAY_MS = 24 * 60 * 60 * 1000;

function httpError(message, status = 400) {
    const error = new Error(message || 'Algo deu errado. Tente novamente.');
    error.response = { status, data: { detail: message } };
    return error;
}

function ensureData(data, error) {
    if (error) throw httpError(error.message || error.details || error.hint);
    return { data };
}

function todayDateOnly() {
    return new Date().toISOString().slice(0, 10);
}

function ageDaysFromDob(dob) {
    if (!dob) return 0;
    const birth = new Date(`${dob}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return 0;
    return Math.max(0, Math.floor((new Date(`${todayDateOnly()}T00:00:00`) - birth) / DAY_MS));
}

function decorateActivity(activity) {
    if (!activity) return activity;
    const category = activity.categories || activity.category || null;
    const stage = activity.age_stages || activity.age_stage || null;
    return {
        ...activity,
        materiais: Array.isArray(activity.materiais) ? activity.materiais : [],
        passos: Array.isArray(activity.passos) ? activity.passos : [],
        disclaimer: activity.disclaimer || DEFAULT_DISCLAIMER,
        category_name: category?.nome,
        category_color: category?.cor,
        stage_title: stage?.titulo,
    };
}

function decorateChild(child, stages = []) {
    const age_days = ageDaysFromDob(child?.dob);
    const age_stage = stages.find((stage) => age_days >= stage.min_days && age_days <= stage.max_days);
    return {
        ...child,
        age_days,
        age_stage_id: age_stage?.id || null,
        age_stage,
    };
}

async function currentAuthUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) throw httpError('Sua sessão expirou. Entre novamente.', 401);
    return data.user;
}

async function currentProfile() {
    const authUser = await currentAuthUser();
    const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, banned, accept_terms, active_child_id, created_at')
        .eq('id', authUser.id)
        .maybeSingle();
    if (error) throw httpError(error.message);
    if (data?.banned) {
        await supabase.auth.signOut();
        throw httpError('Esta conta está bloqueada. Fale com o suporte.', 403);
    }
    return data || {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || 'Família',
        role: 'user',
        banned: false,
        accept_terms: Boolean(authUser.user_metadata?.accept_terms),
        active_child_id: null,
    };
}

async function stages() {
    const { data, error } = await supabase
        .from('age_stages')
        .select('id, slug, titulo, descricao, min_days, max_days, dados_gerais, desenvolvimento, dicas, cuidados')
        .order('min_days', { ascending: true });
    return ensureData(data || [], error).data;
}

async function childrenForCurrentUser() {
    const profile = await currentProfile();
    const { data, error } = await supabase
        .from('children')
        .select('id, user_id, nome, dob, foto_url, created_at, updated_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true });
    const list = ensureData(data || [], error).data;
    const decorated = (await stages()).map((stage) => stage);
    return { profile, children: list.map((child) => decorateChild(child, decorated)) };
}

async function activeChild() {
    const { profile, children } = await childrenForCurrentUser();
    return children.find((child) => child.id === profile.active_child_id) || children[0] || null;
}

async function categories() {
    const { data, error } = await supabase
        .from('categories')
        .select('id, slug, nome, cor, icone')
        .order('nome', { ascending: true });
    return ensureData(data || [], error).data;
}

async function activities(params = {}) {
    let query = supabase
        .from('activities')
        .select('id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer, created_at, updated_at, categories(id, slug, nome, cor, icone), age_stages(id, slug, titulo)')
        .order('created_at', { ascending: true });
    if (params.age_stage_id) query = query.eq('age_stage_id', params.age_stage_id);
    if (params.category_id) query = query.eq('category_id', params.category_id);
    if (params.q) query = query.ilike('titulo', `%${String(params.q).replace(/%/g, '')}%`);
    const { data, error } = await query;
    return ensureData((data || []).map(decorateActivity), error).data;
}

async function activityById(id) {
    const { data, error } = await supabase
        .from('activities')
        .select('id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer, created_at, updated_at, categories(id, slug, nome, cor, icone), age_stages(id, slug, titulo)')
        .eq('id', id)
        .single();
    return ensureData(decorateActivity(data), error).data;
}

async function countRows(table) {
    const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
    if (error) throw httpError(error.message);
    return count || 0;
}

async function parseImport(body, config = {}) {
    const raw = typeof body === 'string' ? body : JSON.stringify(body);
    const contentType = config.headers?.['Content-Type'] || config.headers?.['content-type'] || '';
    if (contentType.includes('json') || raw.trim().startsWith('[') || raw.trim().startsWith('{')) {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body;
        const items = Array.isArray(parsed) ? parsed : (parsed.activities || []);
        return items.map((item) => ({
            ...item,
            materiais: Array.isArray(item.materiais) ? item.materiais : [],
            passos: Array.isArray(item.passos) ? item.passos : [],
            disclaimer: item.disclaimer || DEFAULT_DISCLAIMER,
        }));
    }
    const [headerLine, ...rows] = raw.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(',').map((item) => item.trim());
    return rows.map((line) => {
        const values = line.split(',').map((item) => item.trim());
        return headers.reduce((item, header, index) => ({ ...item, [header]: values[index] || '' }), {});
    });
}

async function adminUsers(params = {}) {
    let query = supabase
        .from('users')
        .select('id, email, name, role, banned, accept_terms, created_at')
        .order('created_at', { ascending: false });
    if (params.q) {
        const q = String(params.q).replace(/[(),]/g, '');
        query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
    }
    const { data, error } = await query;
    return ensureData(data || [], error).data;
}

async function assertStaff() {
    const profile = await currentProfile();
    if (!['super_admin', 'editor', 'moderador'].includes(profile.role)) {
        throw httpError('Você não tem permissão para esta ação.', 403);
    }
    return profile;
}

async function assertContentStaff() {
    const profile = await assertStaff();
    if (!['super_admin', 'editor'].includes(profile.role)) {
        throw httpError('Apenas administradores de conteúdo podem usar esta área.', 403);
    }
    return profile;
}

async function invokeAdminAI(payload) {
    const { data, error } = await supabase.functions.invoke('admin-ai', { body: payload });
    if (error) throw httpError(error.message || 'Não foi possível comunicar com o serviço de IA.');
    if (data?.error) throw httpError(data.error);
    return data?.data ?? data;
}

const api = {
    async get(path, config = {}) {
        if (path === '/auth/me') return { data: await currentProfile() };
        if (path === '/children') return { data: (await childrenForCurrentUser()).children };
        if (path === '/children/me') return { data: await activeChild() };
        if (path === '/categories') return { data: await categories() };
        if (path === '/activities') return { data: await activities(config.params || {}) };
        if (path === '/activities/suggestions') {
            const child = await activeChild();
            if (!child?.age_stage_id) return { data: [] };
            const pinned = await supabase
                .from('pinned_suggestions')
                .select('activity_id, activities(id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer, categories(id, slug, nome, cor, icone), age_stages(id, slug, titulo))')
                .eq('age_stage_id', child.age_stage_id)
                .order('created_at', { ascending: true })
                .limit(5);
            if (pinned.error) throw httpError(pinned.error.message);
            if (pinned.data?.length) return { data: pinned.data.map((item) => decorateActivity(item.activities)).filter(Boolean) };
            return { data: (await activities({ age_stage_id: child.age_stage_id })).slice(0, 5) };
        }
        if (path.startsWith('/activities/')) return { data: await activityById(path.split('/')[2]) };
        if (path === '/age-stages') return { data: await stages() };
        if (path.startsWith('/age-stages/')) {
            const { data, error } = await supabase.from('age_stages').select('*').eq('id', path.split('/')[2]).single();
            return ensureData(data, error);
        }
        if (path === '/favorites') {
            const child = await activeChild();
            if (!child) return { data: [] };
            const { data, error } = await supabase.from('favorites').select('id, child_id, activity_id, created_at').eq('child_id', child.id).order('created_at', { ascending: false });
            return ensureData(data || [], error);
        }
        if (path === '/progress/summary') {
            const child = await activeChild();
            if (!child) return { data: { week_count: 0, month_count: 0, by_category: [] } };
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - 6);
            const monthStart = new Date(now);
            monthStart.setDate(now.getDate() - 29);
            const { data: completions, error } = await supabase
                .from('completions')
                .select('id, activity_id, data, activities(category_id)')
                .eq('child_id', child.id)
                .gte('data', monthStart.toISOString())
                .order('data', { ascending: false });
            if (error) throw httpError(error.message);
            const list = completions || [];
            const week_count = list.filter((item) => new Date(item.data) >= weekStart).length;
            const categoryList = await categories();
            const totals = categoryList.map((category) => ({ category_id: category.id, slug: category.slug, nome: category.nome, cor: category.cor, count: 0 }));
            list.forEach((item) => {
                const category = totals.find((entry) => entry.category_id === item.activities?.category_id);
                if (category) category.count += 1;
            });
            return { data: { week_count, month_count: list.length, by_category: totals } };
        }
        if (path.startsWith('/invites/')) {
            const token = path.split('/')[2];
            const { data, error } = await supabase.from('invites').select('id, email, role, token, expires_at, invited_by_name, used').eq('token', token).eq('used', false).gt('expires_at', new Date().toISOString()).single();
            return ensureData(data, error);
        }
        if (path === '/admin/stats') {
            await assertStaff();
            const [users, children, activities, favorites, banned] = await Promise.all([
                countRows('users'),
                countRows('children'),
                countRows('activities'),
                countRows('favorites'),
                supabase.from('users').select('id', { count: 'exact', head: true }).eq('banned', true),
            ]);
            if (banned.error) throw httpError(banned.error.message);

            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - 6);
            const monthStart = new Date(today);
            monthStart.setDate(today.getDate() - 29);
            const weekStartIso = weekStart.toISOString();
            const monthStartIso = monthStart.toISOString();

            const [{ count: weekSignups, error: signupsError }, { data: completionRows, error: completionsError }] = await Promise.all([
                supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', weekStartIso),
                supabase.from('completions').select('id, activity_id, data, activities(category_id, titulo)').gte('data', monthStartIso).order('data', { ascending: false }),
            ]);
            if (signupsError) throw httpError(signupsError.message);
            if (completionsError) throw httpError(completionsError.message);

            const categoryList = await categories();
            const byCategory = categoryList.map((category) => ({ category_id: category.id, nome: category.nome, cor: category.cor, count: 0 }));
            const topMap = new Map();
            (completionRows || []).forEach((row) => {
                const category = byCategory.find((item) => item.category_id === row.activities?.category_id);
                if (category) category.count += 1;
                const activityId = row.activity_id;
                const current = topMap.get(activityId) || { activity_id: activityId, titulo: row.activities?.titulo || 'Atividade', count: 0 };
                current.count += 1;
                topMap.set(activityId, current);
            });

            return {
                data: {
                    totals: {
                        users,
                        children,
                        activities,
                        completions: completionRows?.length || 0,
                        favorites,
                        banned: banned.count || 0,
                    },
                    activity: {
                        week_signups: weekSignups || 0,
                        week_completions: (completionRows || []).filter((row) => new Date(row.data) >= weekStart).length,
                        month_completions: completionRows?.length || 0,
                    },
                    by_category: byCategory,
                    top_activities: Array.from(topMap.values()).sort((a, b) => b.count - a.count).slice(0, 5),
                },
            };
        }
        if (path === '/admin/users') {
            await assertStaff();
            return { data: await adminUsers(config.params || {}) };
        }
        if (path.startsWith('/admin/users/')) {
            await assertStaff();
            const id = path.split('/')[3];
            const { data: user, error } = await supabase.from('users').select('id, email, name, role, banned, accept_terms, created_at').eq('id', id).single();
            if (error) throw httpError(error.message);
            const { data: children, error: childError } = await supabase.from('children').select('id, nome, dob, foto_url').eq('user_id', id).order('created_at', { ascending: true });
            if (childError) throw httpError(childError.message);
            const childIds = (children || []).map((child) => child.id);
            let completions_count = 0;
            if (childIds.length) {
                const { count, error: completionError } = await supabase.from('completions').select('id', { count: 'exact', head: true }).in('child_id', childIds);
                if (completionError) throw httpError(completionError.message);
                completions_count = count || 0;
            }
            return { data: { ...user, children: children || [], completions_count } };
        }
        if (path === '/admin/activities') return { data: await activities(config.params || {}) };
        if (path === '/admin/invites') {
            await assertStaff();
            const { data, error } = await supabase.from('invites').select('id, email, role, token, expires_at, invited_by_name, used, created_at').order('created_at', { ascending: false });
            return ensureData(data || [], error);
        }
        if (path === '/admin/settings') {
            await assertContentStaff();
            const { data, error } = await supabase.from('app_settings').select('key, value_json, updated_by, updated_at').order('key', { ascending: true });
            return ensureData(data || [], error);
        }
        if (path === '/admin/prompts') {
            await assertContentStaff();
            const { data, error } = await supabase.from('admin_prompts').select('prompt_key, kind, name, system_prompt, user_prompt, output_schema, updated_by, updated_at').order('kind', { ascending: true }).order('name', { ascending: true });
            return ensureData(data || [], error);
        }
        if (path === '/admin/ai-models') {
            await assertContentStaff();
            return { data: await invokeAdminAI({ action: 'models' }) };
        }
        if (path === '/admin/ai-jobs') {
            await assertContentStaff();
            const limit = Math.min(100, Math.max(1, Number(config.params?.limit) || 40));
            const { data, error } = await supabase.from('ai_generation_jobs').select('id, kind, model, prompt_key, input_json, output_json, status, error_message, created_by, created_at, completed_at').order('created_at', { ascending: false }).limit(limit);
            return ensureData(data || [], error);
        }
        if (path === '/admin/pinned-suggestions') {
            await assertStaff();
            let query = supabase.from('pinned_suggestions').select('id, age_stage_id, activity_id, created_at, activities(id, titulo), age_stages(id, titulo)').order('created_at', { ascending: true });
            if (config.params?.age_stage_id) query = query.eq('age_stage_id', config.params.age_stage_id);
            const { data, error } = await query;
            return ensureData(data || [], error);
        }
        throw httpError(`Rota não implementada no Supabase: GET ${path}`, 404);
    },

    async post(path, payload, config = {}) {
        if (path === '/auth/login') {
            const { data, error } = await supabase.auth.signInWithPassword({ email: payload.email, password: payload.password });
            if (error) throw httpError(error.message, 401);
            const profile = await currentProfile();
            return { data: { ...profile, token: data.session?.access_token } };
        }
        if (path === '/auth/register') {
            const { data, error } = await supabase.auth.signUp({
                email: payload.email,
                password: payload.password,
                options: { data: { name: payload.name, accept_terms: Boolean(payload.accept_terms) } },
            });
            if (error) throw httpError(error.message);
            if (!data.session) return { data: { pending_confirmation: true, email: payload.email } };
            const profile = await currentProfile();
            return { data: { ...profile, token: data.session.access_token } };
        }
        if (path === '/auth/logout') {
            const { error } = await supabase.auth.signOut();
            if (error) throw httpError(error.message);
            return { data: null };
        }
        if (path === '/children') {
            const profile = await currentProfile();
            const { data, error } = await supabase.from('children').insert({ user_id: profile.id, nome: payload.nome, dob: payload.dob, foto_url: payload.foto_url || null }).select('*').single();
            return ensureData(data, error);
        }
        if (path === '/children/active') {
            const profile = await currentProfile();
            const { data, error } = await supabase.from('users').update({ active_child_id: payload.child_id, updated_at: new Date().toISOString() }).eq('id', profile.id).select('active_child_id').single();
            return ensureData(data, error);
        }
        if (path === '/favorites/toggle') {
            const child = await activeChild();
            if (!child) throw httpError('Cadastre uma criança antes de favoritar atividades.');
            const existing = await supabase.from('favorites').select('id').eq('child_id', child.id).eq('activity_id', payload.activity_id).maybeSingle();
            if (existing.error) throw httpError(existing.error.message);
            if (existing.data) {
                const { error } = await supabase.from('favorites').delete().eq('id', existing.data.id);
                if (error) throw httpError(error.message);
                return { data: { favorited: false } };
            }
            const { error } = await supabase.from('favorites').insert({ child_id: child.id, activity_id: payload.activity_id });
            if (error) throw httpError(error.message);
            return { data: { favorited: true } };
        }
        if (path === '/completions') {
            const child = await activeChild();
            if (!child) throw httpError('Cadastre uma criança antes de concluir atividades.');
            const { data, error } = await supabase.from('completions').insert({ child_id: child.id, activity_id: payload.activity_id }).select('id, child_id, activity_id, data').single();
            return ensureData(data, error);
        }
        if (path.startsWith('/invites/') && path.endsWith('/accept')) {
            const token = path.split('/')[2];
            const invite = await api.get(`/invites/${token}`);
            const { data, error } = await supabase.auth.signUp({ email: invite.data.email, password: payload.password, options: { data: { name: payload.name, accept_terms: true } } });
            if (error) throw httpError(error.message);
            if (!data.session) return { data: { pending_confirmation: true, email: invite.data.email } };
            return { data: { ...(await currentProfile()), token: data.session.access_token } };
        }
        if (path === '/admin/activities/import/preview') {
            await assertStaff();
            try {
                const items = await parseImport(payload, config);
                const current = await activities();
                const existing = new Set(current.map((item) => item.id));
                const to_create = items.filter((item) => item.id && !existing.has(item.id));
                return { data: { total: items.length, created_count: to_create.length, skipped_count: items.length - to_create.length, error_count: 0, to_create, errors: [] } };
            } catch (error) {
                throw httpError(`Não foi possível ler o arquivo: ${error.message}`);
            }
        }
        if (path === '/admin/activities/import/commit') {
            await assertStaff();
            const items = payload.activities || [];
            const { data, error } = await supabase.from('activities').upsert(items.map((item) => ({ ...item, disclaimer: item.disclaimer || DEFAULT_DISCLAIMER })), { onConflict: 'id' }).select('id');
            return ensureData({ created_count: data?.length || 0 }, error);
        }
        if (path === '/admin/activities') {
            await assertStaff();
            const { data, error } = await supabase.from('activities').insert({ ...payload, disclaimer: payload.disclaimer || DEFAULT_DISCLAIMER }).select('*').single();
            return ensureData(decorateActivity(data), error);
        }
        if (path === '/admin/age-stages') {
            await assertStaff();
            const { data, error } = await supabase.from('age_stages').insert(payload).select('*').single();
            return ensureData(data, error);
        }
        if (path === '/admin/categories') {
            await assertStaff();
            const { data, error } = await supabase.from('categories').insert(payload).select('*').single();
            return ensureData(data, error);
        }
        if (path === '/admin/pinned-suggestions') {
            await assertStaff();
            const { data, error } = await supabase.from('pinned_suggestions').insert(payload).select('*').single();
            return ensureData(data, error);
        }
        if (path === '/admin/prompts') {
            const profile = await assertContentStaff();
            const { data, error } = await supabase.from('admin_prompts').insert({ prompt_key: payload.prompt_key, kind: payload.kind, name: payload.name, system_prompt: payload.system_prompt || '', user_prompt: payload.user_prompt || '', output_schema: payload.output_schema || {}, updated_by: profile.id }).select('prompt_key, kind, name, system_prompt, user_prompt, output_schema, updated_by, updated_at').single();
            return ensureData(data, error);
        }
        if (path === '/admin/ai-generate') {
            await assertContentStaff();
            return { data: await invokeAdminAI({ action: 'generate', ...payload }) };
        }
        if (path.startsWith('/admin/ai-apply/')) {
            await assertContentStaff();
            return { data: await invokeAdminAI({ action: 'apply', job_id: path.split('/')[3] }) };
        }
        if (path === '/admin/invites') {
            const profile = await assertStaff();
            const token = crypto.randomUUID();
            const { data, error } = await supabase.from('invites').insert({ ...payload, token, invited_by: profile.id, invited_by_name: profile.name || 'Admin' }).select('*').single();
            return ensureData(data, error);
        }
        if (path.startsWith('/admin/users/') && path.endsWith('/reset-password')) {
            await assertStaff();
            const id = path.split('/')[3];
            const { data: user, error } = await supabase.from('users').select('email').eq('id', id).single();
            if (error) throw httpError(error.message);
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin + '/perfil' });
            if (resetError) throw httpError(resetError.message);
            return { data: { new_password: 'Link de redefinição enviado ao e-mail do usuário.' } };
        }
        if (path === '/admin/activities/import/commit') throw httpError('Importação inválida.');
        throw httpError(`Rota não implementada no Supabase: POST ${path}`, 404);
    },

    async put(path, payload) {
        if (path.startsWith('/admin/settings/')) {
            const profile = await assertContentStaff();
            const key = decodeURIComponent(path.split('/')[3]);
            const value_json = Object.prototype.hasOwnProperty.call(payload || {}, 'value_json') ? payload.value_json : payload?.value;
            const { data, error } = await supabase.from('app_settings').upsert({ key, value_json: value_json ?? null, updated_by: profile.id, updated_at: new Date().toISOString() }, { onConflict: 'key' }).select('key, value_json, updated_by, updated_at').single();
            return ensureData(data, error);
        }
        if (path.startsWith('/admin/prompts/')) {
            const profile = await assertContentStaff();
            const prompt_key = decodeURIComponent(path.split('/')[3]);
            const { data, error } = await supabase.from('admin_prompts').update({ kind: payload.kind, name: payload.name, system_prompt: payload.system_prompt, user_prompt: payload.user_prompt, output_schema: payload.output_schema, updated_by: profile.id, updated_at: new Date().toISOString() }).eq('prompt_key', prompt_key).select('prompt_key, kind, name, system_prompt, user_prompt, output_schema, updated_by, updated_at').single();
            return ensureData(data, error);
        }
        if (path.startsWith('/children/')) {
            const profile = await currentProfile();
            const id = path.split('/')[2];
            const { data, error } = await supabase.from('children').update({ nome: payload.nome, dob: payload.dob, foto_url: payload.foto_url || null, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', profile.id).select('*').single();
            return ensureData(data, error);
        }
        if (path.startsWith('/admin/activities/')) {
            await assertStaff();
            const id = path.split('/')[3];
            const { data, error } = await supabase.from('activities').update({ ...payload, disclaimer: payload.disclaimer || DEFAULT_DISCLAIMER, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
            return ensureData(decorateActivity(data), error);
        }
        if (path.startsWith('/admin/age-stages/')) {
            await assertStaff();
            const id = path.split('/')[3];
            const { data, error } = await supabase.from('age_stages').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
            return ensureData(data, error);
        }
        if (path.startsWith('/admin/categories/')) {
            await assertStaff();
            const id = path.split('/')[3];
            const { data, error } = await supabase.from('categories').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
            return ensureData(data, error);
        }
        throw httpError(`Rota não implementada no Supabase: PUT ${path}`, 404);
    },

    async patch(path, payload) {
        if (path.startsWith('/admin/users/')) {
            await assertStaff();
            const id = path.split('/')[3];
            const { data, error } = await supabase.from('users').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('id, email, name, role, banned, accept_terms, created_at').single();
            return ensureData(data, error);
        }
        throw httpError(`Rota não implementada no Supabase: PATCH ${path}`, 404);
    },

    async delete(path) {
        if (path === '/auth/account') {
            const { error } = await supabase.rpc('delete_my_account');
            if (error) throw httpError(error.message);
            await supabase.auth.signOut();
            return { data: null };
        }
        if (path.startsWith('/children/')) {
            const profile = await currentProfile();
            const id = path.split('/')[2];
            const { error } = await supabase.from('children').delete().eq('id', id).eq('user_id', profile.id);
            if (error) throw httpError(error.message);
            return { data: null };
        }
        if (path.startsWith('/admin/prompts/')) {
            await assertContentStaff();
            const prompt_key = decodeURIComponent(path.split('/')[3]);
            const { error } = await supabase.from('admin_prompts').delete().eq('prompt_key', prompt_key);
            if (error) throw httpError(error.message);
            return { data: null };
        }
        if (path.startsWith('/admin/activities/')) {
            await assertStaff();
            const id = path.split('/')[3];
            const { error } = await supabase.from('activities').delete().eq('id', id);
            if (error) throw httpError(error.message);
            return { data: null };
        }
        if (path.startsWith('/admin/age-stages/')) {
            await assertStaff();
            const id = path.split('/')[3];
            const { error } = await supabase.from('age_stages').delete().eq('id', id);
            if (error) throw httpError(error.message);
            return { data: null };
        }
        if (path.startsWith('/admin/categories/')) {
            await assertStaff();
            const id = path.split('/')[3];
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw httpError(error.message);
            return { data: null };
        }
        if (path.startsWith('/admin/pinned-suggestions/')) {
            await assertStaff();
            const id = path.split('/')[3];
            const { error } = await supabase.from('pinned_suggestions').delete().eq('id', id);
            if (error) throw httpError(error.message);
            return { data: null };
        }
        if (path.startsWith('/admin/invites/')) {
            await assertStaff();
            const id = path.split('/')[3];
            const { error } = await supabase.from('invites').delete().eq('id', id);
            if (error) throw httpError(error.message);
            return { data: null };
        }
        if (path.startsWith('/admin/users/')) {
            await assertStaff();
            const id = path.split('/')[3];
            const { error } = await supabase.from('users').delete().eq('id', id);
            if (error) throw httpError(error.message);
            return { data: null };
        }
        throw httpError(`Rota não implementada no Supabase: DELETE ${path}`, 404);
    },
};

export function formatApiError(detail) {
    if (detail == null) return 'Algo deu errado. Tente novamente.';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((item) => (item && typeof item.msg === 'string' ? item.msg : JSON.stringify(item))).filter(Boolean).join(' ');
    if (detail && typeof detail.msg === 'string') return detail.msg;
    return String(detail);
}

export default api;
