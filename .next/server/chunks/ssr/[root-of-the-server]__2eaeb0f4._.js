module.exports = [
"[project]/app/(platform)/learn/[slug]/[lessonId]/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"6099d0d0ca704fd1ca41a6a3e17a9f7926cb2b532a":"markLessonCompleted","70139d328d33d372b7b64366e0b5434cffef25016b":"addLessonComment"},"",""] */ __turbopack_context__.s([
    "addLessonComment",
    ()=>addLessonComment,
    "markLessonCompleted",
    ()=>markLessonCompleted
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function markLessonCompleted(lessonId, slug) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {
        error: "No autorizado"
    };
    // Verificar si ya está completada
    const { data: existingProgress } = await supabase.from("user_progress").select("*").eq("user_id", user.id).eq("lesson_id", lessonId).single();
    if (existingProgress?.is_completed) {
        return {
            success: true,
            alreadyCompleted: true
        };
    }
    if (existingProgress) {
        // Actualizar
        const { error } = await supabase.from("user_progress").update({
            is_completed: true,
            completed_at: new Date().toISOString()
        }).eq("id", existingProgress.id);
        if (error) return {
            error: error.message
        };
    } else {
        // Insertar
        const { error } = await supabase.from("user_progress").insert({
            user_id: user.id,
            lesson_id: lessonId,
            status: 'completed',
            is_completed: true,
            completed_at: new Date().toISOString(),
            progress_percent: 100
        });
        if (error) return {
            error: error.message
        };
    }
    // Opcional: Sumar XP al perfil
    const { data: profile } = await supabase.from("profiles").select("xp, level, streak_days, last_activity_date").eq("id", user.id).single();
    if (profile) {
        const todayStr = new Date().toISOString().split('T')[0];
        let newStreak = profile.streak_days || 0;
        let lastActivityStr = profile.last_activity_date ? new Date(profile.last_activity_date).toISOString().split('T')[0] : "";
        if (lastActivityStr !== todayStr) {
            const today = new Date(todayStr);
            const last = new Date(lastActivityStr || "2000-01-01");
            const diffTime = Math.abs(today.getTime() - last.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                newStreak += 1;
            } else {
                newStreak = 1; // Reset streak or start first day
            }
        }
        const newXp = (profile.xp || 0) + 50 // +50 XP per lesson
        ;
        let newLevel = profile.level || 1;
        if (newXp >= newLevel * 500) {
            newLevel += 1;
        }
        await supabase.from("profiles").update({
            xp: newXp,
            level: newLevel,
            streak_days: newStreak,
            last_activity_date: new Date().toISOString()
        }).eq("id", user.id);
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/learn/${slug}/${lessonId}`);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/dashboard`);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/formations/${slug}`);
    return {
        success: true
    };
}
async function addLessonComment(formData, lessonId, slug) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {
        error: "No autorizado"
    };
    const content = formData.get("content");
    if (!content || !content.trim()) return {
        error: "El comentario no puede estar vacío."
    };
    const { error } = await supabase.from("reflections").insert({
        user_id: user.id,
        lesson_id: lessonId,
        content: content.trim(),
        is_public: true
    });
    if (error) return {
        error: error.message
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/learn/${slug}/${lessonId}`);
    return {
        success: true
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    markLessonCompleted,
    addLessonComment
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(markLessonCompleted, "6099d0d0ca704fd1ca41a6a3e17a9f7926cb2b532a", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addLessonComment, "70139d328d33d372b7b64366e0b5434cffef25016b", null);
}),
"[project]/.next-internal/server/app/(platform)/learn/[slug]/[lessonId]/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/(platform)/learn/[slug]/[lessonId]/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$platform$292f$learn$2f5b$slug$5d2f5b$lessonId$5d2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/(platform)/learn/[slug]/[lessonId]/actions.ts [app-rsc] (ecmascript)");
;
}),
"[project]/.next-internal/server/app/(platform)/learn/[slug]/[lessonId]/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/(platform)/learn/[slug]/[lessonId]/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "70139d328d33d372b7b64366e0b5434cffef25016b",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$platform$292f$learn$2f5b$slug$5d2f5b$lessonId$5d2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["addLessonComment"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$platform$292f$learn$2f5b$slug$5d2f5b$lessonId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$app$2f28$platform$292f$learn$2f5b$slug$5d2f5b$lessonId$5d2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(platform)/learn/[slug]/[lessonId]/page/actions.js { ACTIONS_MODULE0 => "[project]/app/(platform)/learn/[slug]/[lessonId]/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$platform$292f$learn$2f5b$slug$5d2f5b$lessonId$5d2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/(platform)/learn/[slug]/[lessonId]/actions.ts [app-rsc] (ecmascript)");
}),
"[project]/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/(platform)/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/(platform)/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/(platform)/learn/[slug]/[lessonId]/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/(platform)/learn/[slug]/[lessonId]/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/(platform)/learn/[slug]/[lessonId]/lesson-viewer.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "LessonViewer",
    ()=>LessonViewer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const LessonViewer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call LessonViewer() from the server but LessonViewer is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/app/(platform)/learn/[slug]/[lessonId]/lesson-viewer.tsx <module evaluation>", "LessonViewer");
}),
"[project]/app/(platform)/learn/[slug]/[lessonId]/lesson-viewer.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "LessonViewer",
    ()=>LessonViewer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const LessonViewer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call LessonViewer() from the server but LessonViewer is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/app/(platform)/learn/[slug]/[lessonId]/lesson-viewer.tsx", "LessonViewer");
}),
"[project]/app/(platform)/learn/[slug]/[lessonId]/lesson-viewer.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$platform$292f$learn$2f5b$slug$5d2f5b$lessonId$5d2f$lesson$2d$viewer$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/app/(platform)/learn/[slug]/[lessonId]/lesson-viewer.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$platform$292f$learn$2f5b$slug$5d2f5b$lessonId$5d2f$lesson$2d$viewer$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/app/(platform)/learn/[slug]/[lessonId]/lesson-viewer.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$platform$292f$learn$2f5b$slug$5d2f5b$lessonId$5d2f$lesson$2d$viewer$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/app/(platform)/learn/[slug]/[lessonId]/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LessonViewerPage,
    "generateMetadata",
    ()=>generateMetadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$platform$292f$learn$2f5b$slug$5d2f5b$lessonId$5d2f$lesson$2d$viewer$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/(platform)/learn/[slug]/[lessonId]/lesson-viewer.tsx [app-rsc] (ecmascript)");
;
;
;
;
async function getLessonData(slug, lessonId, userId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Get formation with all modules and lessons
    const { data: formation, error: formationError } = await supabase.from("formations").select(`
      id,
      title,
      slug,
      modules (
        id,
        title,
        sort_order,
        lessons (
          id,
          title,
          description,
          duration_seconds,
          video_url,
          is_free,
          sort_order
        )
      )
    `).eq("slug", slug).single();
    if (formationError || !formation) {
        return null;
    }
    // Sort modules and lessons
    formation.modules = formation.modules?.sort((a, b)=>(a.sort_order || 0) - (b.sort_order || 0)).map((mod)=>({
            ...mod,
            lessons: mod.lessons?.sort((a, b)=>(a.sort_order || 0) - (b.sort_order || 0)) || []
        })) || [];
    // Find current lesson and its module
    let currentLesson = null;
    let currentModule = null;
    let previousLesson = null;
    let nextLesson = null;
    let lessonIndex = 0;
    // Flatten all lessons with their module info
    const allLessons = [];
    formation.modules.forEach((mod)=>{
        mod.lessons.forEach((les)=>{
            allLessons.push({
                ...les,
                module: mod
            });
        });
    });
    // Find current, previous, and next
    for(let i = 0; i < allLessons.length; i++){
        if (allLessons[i].id === lessonId) {
            currentLesson = allLessons[i];
            currentModule = allLessons[i].module;
            lessonIndex = i;
            if (i > 0) previousLesson = allLessons[i - 1];
            if (i < allLessons.length - 1) nextLesson = allLessons[i + 1];
            break;
        }
    }
    if (!currentLesson) {
        return null;
    }
    // Check enrollment
    const { data: enrollment } = await supabase.from("enrollments").select("*").eq("user_id", userId).eq("formation_id", formation.id).single();
    const isEnrolled = !!enrollment;
    // If not enrolled and lesson is not free, redirect
    if (!isEnrolled && !currentLesson.is_free) {
        return {
            notEnrolled: true,
            formationSlug: formation.slug
        };
    }
    // Get user progress for all lessons
    const lessonIds = allLessons.map((l)=>l.id);
    const { data: userProgress } = await supabase.from("user_progress").select("lesson_id, is_completed, watched_seconds").eq("user_id", userId).in("lesson_id", lessonIds);
    const completedLessons = userProgress?.filter((p)=>p.is_completed).map((p)=>p.lesson_id) || [];
    const currentProgress = userProgress?.find((p)=>p.lesson_id === lessonId);
    // Build curriculum with completion status
    const curriculum = formation.modules.map((mod, modIndex)=>({
            id: mod.id,
            title: mod.title,
            order: modIndex + 1,
            lessons: mod.lessons.map((les)=>({
                    id: les.id,
                    title: les.title,
                    isCompleted: completedLessons.includes(les.id),
                    isCurrent: les.id === lessonId
                }))
        }));
    // Fetch Comments
    const { data: comments } = await supabase.from("reflections").select(`
      id, content, created_at, user_id,
      profiles:user_id ( full_name, avatar_url, role )
    `).eq("lesson_id", lessonId).order("created_at", {
        ascending: false
    });
    return {
        lesson: {
            id: currentLesson.id,
            title: currentLesson.title,
            description: currentLesson.description,
            videoUrl: currentLesson.video_url,
            durationSeconds: currentLesson.duration_seconds,
            xpReward: 50,
            isCompleted: completedLessons.includes(currentLesson.id),
            watchedSeconds: currentProgress?.watched_seconds || 0
        },
        comments: comments || [],
        module: {
            id: currentModule.id,
            title: currentModule.title,
            order: formation.modules.findIndex((m)=>m.id === currentModule.id) + 1
        },
        formation: {
            id: formation.id,
            title: formation.title,
            slug: formation.slug
        },
        curriculum,
        previousLesson: previousLesson ? {
            id: previousLesson.id,
            title: previousLesson.title
        } : null,
        nextLesson: nextLesson ? {
            id: nextLesson.id,
            title: nextLesson.title
        } : null,
        completedCount: completedLessons.length,
        totalCount: allLessons.length
    };
}
async function generateMetadata({ params }) {
    const { slug, lessonId } = await params;
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: lesson } = await supabase.from("lessons").select("title").eq("id", lessonId).single();
    return {
        title: lesson ? `${lesson.title} | Ainara` : "Leccion | Ainara"
    };
}
async function LessonViewerPage({ params }) {
    const { slug, lessonId } = await params;
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])(`/login?redirect=${encodeURIComponent(`/learn/${slug}/${lessonId}`)}`);
    }
    const data = await getLessonData(slug, lessonId, user.id);
    if (!data) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["notFound"])();
    }
    if ("notEnrolled" in data) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])(`/formations/${data.formationSlug}`);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$platform$292f$learn$2f5b$slug$5d2f5b$lessonId$5d2f$lesson$2d$viewer$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["LessonViewer"], {
        data: data
    }, void 0, false, {
        fileName: "[project]/app/(platform)/learn/[slug]/[lessonId]/page.tsx",
        lineNumber: 193,
        columnNumber: 10
    }, this);
}
}),
"[project]/app/(platform)/learn/[slug]/[lessonId]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/(platform)/learn/[slug]/[lessonId]/page.tsx [app-rsc] (ecmascript)"));
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2eaeb0f4._.js.map