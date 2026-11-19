import llm from "../../utils/llm/llm"
import { cleanMarkdown } from "./markdown"

export type LearningMode = "summary" | "lesson" | "exercises" | "questions"
export type LearningTemplate = "quick" | "academic" | "exam" | "pedagogical"
export type LearningDifficulty = "easy" | "medium" | "hard"

export type LearningOptions = {
  learningMode?: LearningMode
  template?: LearningTemplate
  difficulty?: LearningDifficulty
  answers?: boolean
}

export type LearningFile = {
  mode: LearningMode
  template: LearningTemplate
  markdown: string
}

const MODE_LABEL: Record<LearningMode, string> = {
  summary: "resumo de estudo",
  lesson: "aula completa",
  exercises: "série de exercícios",
  questions: "série de perguntas",
}

const TEMPLATE_RULE: Record<LearningTemplate, string> = {
  quick:
    "Quick revision template: compact, scannable, one-page feel. Prefer short paragraphs and bullet lists. Keep only the highest-value ideas.",
  academic:
    "Academic template: formal and complete, with precise definitions, numbered sections, formulas, worked examples, and a clear logical progression.",
  exam:
    "Exam-preparation template: focused on what is likely to be assessed, common traps, method steps, and rapid self-check questions. Include point values or time hints when useful.",
  pedagogical:
    "Pedagogical template: a classroom-ready lesson that follows the skeleton below closely and adapts section names to the subject.",
}

function difficultyRule(d: LearningDifficulty) {
  if (d === "easy") return "Target a beginner: simple vocabulary, explicit steps, and gentle progression."
  if (d === "hard") return "Target an advanced learner: dense reasoning, edge cases, and challenging applications."
  return "Target an intermediate learner: clear explanations with application-level depth."
}

function summaryStructure(template: LearningTemplate, answers: boolean) {
  if (template === "pedagogical") {
    return `Use this structure:
# <título claro em português>
> **Nível:** <infer it from the source, or write "não informado na fonte">
> **Fonte:** <source title>
## 🎯 Competências-alvo
3 to 5 bullets describing what the learner must be able to do.
## 🧭 Mapa de conceitos
A Markdown table with 4 to 8 rows: | Conceito | Definição breve | Relação com os outros conceitos |
## 📌 Conceitos essenciais
3 to 6 subsections. For each: a precise definition, a formula or example when relevant, and one sentence explaining why it matters.
## 🧮 Fórmulas e regras essenciais
A table or bullet list of the key formulas/rules. Omit this section if the source has no formulas.
## ⚠️ Erros comuns
3 to 5 common mistakes and how to avoid them.
## ✅ Pontos de revisão rápida
6 to 8 bullets with the highest-value facts and relationships.
## 📝 Autoavaliação
4 to 6 short questions covering the whole source. ${answers ? "Add a concise answer under each question." : "Do not include answers."}`
  }
  if (template === "exam") {
    return `Use this structure:
# <título claro em português>
## O que você precisa saber antes da prova
5 to 8 bullets with the essential facts, formulas, and definitions.
## Conceitos essenciais em resumo
3 to 6 bolded concepts, each explained in 2..3 sentences.
## Fórmulas e regras
A compact table or list of formulas and rules. Omit if not relevant.
## Erros comuns na prova
3 to 5 traps with the correct approach.
## Perguntas rápidas de prova
4 to 6 exam-style questions. ${answers ? "Add a concise model answer for each." : "Do not include answers."}`
  }
  return `Use this structure:
# <título claro em português>
## Visão geral
A short paragraph: what the source covers and why it matters.
## Conceitos essenciais
3 to 6 subsections. Bold each key term, explain it in 2..4 sentences, and add a formula or example when relevant.
## Pontos de revisão rápida
5 to 8 bullets with the most important facts and relationships.
## Perguntas rápidas
3 to 5 short questions. ${answers ? "Add a one-line answer under each question." : "Do not include answers."}`
}

function lessonStructure(template: LearningTemplate, answers: boolean) {
  const solutions = answers
    ? `**Solução detalhada:**
Write numbered steps. Justify each key step, show the main calculation, and state the final result clearly. Keep the solution focused and free of repetition.`
    : `Do not include the solution. Keep only the exercise statement and what the learner must find.`

  if (template === "pedagogical") {
    return `Use this structure exactly, adapting the section titles to the subject when needed:
# <título da aula>

> **Público-alvo:** <infer it from the source, or write "estudantes do nível ...">
> **Fonte:** <source title>

## 🎯 Competências-alvo
3 to 5 measurable competencies. Start each with an action verb: definir, aplicar, analisar, inferir, empregar...

## 🚀 Introdução
A motivating contextual, historical, or practical introduction that shows why the concept is needed. Include a concrete example or two contrasting cases that motivate the new concept.

## 📚 Eixo 1: <título do eixo>
### 1. Definição
**Definição:** A precise definition supported by the source.
### 2. Notações e observações
Bullets for notation, vocabulary, conditions, and special cases.
### 3. Exemplos rápidos
2 to 3 short examples with the answer or a one-line justification.
### 4. Propriedades e teoremas (se houver)
The key properties/theorems, with conditions stated clearly. Omit if not relevant.
### 5. Tabela de valores ou resumo (se houver)
A Markdown table only when it genuinely organizes the content. Omit if not relevant.
### 6. Representação gráfica ou geométrica (se houver)
Describe the figure, axes, points, or geometric interpretation precisely. Omit if not relevant.

## 📐 Eixo 2: <título do eixo>
Repeat the same pedagogical progression as the first axis. Use exactly two axes in total; never add a third axis or an empty subsection.

## ✍️ Exercícios aplicados ${answers ? "com solução" : "sem soluções"}
### Exercício 1: <título curto>
**Enunciado:**
One exercise with 2 or 3 numbered questions that combines both axes.
${solutions}

## ✅ Resumo da aula
A compact recap: the definitions, the key properties, and the method to follow.

## 📝 Autoavaliação
4 questions ordered from recall to application. ${answers ? "Add a short answer for each." : "Do not include answers."}`
  }

  if (template === "quick") {
    return `Use this structure:
# <título da aula em português>
## Objetivos rápidos
3 to 5 measurable objectives.
## Ideia central
A short motivating explanation that connects to prior knowledge.
## Explicação resumida
3 to 5 progressive sections with definitions, formulas, and one concrete example each.
## Exemplo resolvido
One worked example with clear steps.
## Resumo
5 to 7 bullets.
## Exercício rápido
1 to 2 exercises. ${answers ? "Add the solution under ## Solução." : "Do not include solutions."}`
  }

  if (template === "exam") {
    return `Use this structure:
# <título da aula em português>
## Objetivos da prova
3 to 5 competencies likely to be assessed.
## Fundamentos essenciais
Definitions, formulas, and conditions in a compact table or bullet list.
## Método de resolução passo a passo
A general method for the main types of questions, with what to check at each step.
## Exemplos de prova resolvidos
2 to 3 exam-style examples with full reasoning and common traps highlighted.
## Erros comuns
3 to 5 errors and how to avoid them.
## Treino cronometrado
2 to 3 exercises with a suggested time. ${answers ? "Add a complete answer key under ## Soluções." : "Do not include solutions."}`
  }

  return `Use this structure:
# <título da aula em português>
## Pré-requisitos
3 to 5 prerequisites the learner needs.
## Objetivos de aprendizagem
3 to 5 measurable objectives.
## Introdução
A short motivating introduction that connects to prior knowledge.
## Explicação passo a passo
3 to 6 sections that build the concept progressively. For each section: a precise definition, the key properties or theorem, a formula when relevant, and a concrete example.
## Exemplos resolvidos
2 to 4 worked examples with the reasoning shown.
## Erros comuns
3 to 5 common mistakes and how to avoid them.
## Resumo
A compact recap of the lesson.
## Exercícios rápidos
3 to 5 exercises. ${answers ? "Add a complete answer key at the end under ## Soluções." : "Do not include solutions."}`
}

function exercisesStructure(template: LearningTemplate, answers: boolean) {
  if (template === "pedagogical") {
    return `Use this structure:
# <título claro em português>
> **Nível:** <infer it or write "não informado na fonte">
## 🎯 Competências-alvo
3 to 5 competencies targeted by the exercise set.
## 📋 Instruções
Instructions, notation, allowed tools, and the expected work.
## 🟢 Nível 1: aplicação direta
3 to 4 exercises that apply definitions, formulas, and standard methods.
## 🟠 Nível 2: análise e raciocínio
2 to 3 exercises that require several steps, comparison, or justification.
## 🔴 Nível 3: desafio
1 to 2 challenging exercises that combine several ideas.
## 💡 Dicas
One short hint per exercise, only if it helps without revealing the answer.
${answers ? `## ✅ Soluções detalhadas
For every exercise: numbered steps, the reasoning, and the final result. Add a short "Por quê?" note for the key step.` : "Do not include solutions."}
## 📊 Critérios de avaliação
A short rubric: what a correct answer must contain.`
  }
  if (template === "exam") {
    return `Use this structure:
# <título claro em português>
## Instruções da prova
Duration, allowed tools, and instructions.
## Exercícios de prova
6 to 8 exam-style exercises with point values and a suggested time.
## Erros comuns
3 to 5 traps and how to avoid them.
${answers ? "## Critérios de correção e soluções\nA complete answer key with the marking points." : "Do not include solutions."}`
  }
  if (template === "quick") {
    return `Use this structure:
# <título claro em português>
## Instruções
One short paragraph.
## Exercícios
6 to 8 short exercises ordered by difficulty.
${answers ? "## Soluções\nA concise answer for each exercise." : "Do not include solutions."}`
  }
  return `Use this structure:
# <título claro em português>
## Instruções
Brief instructions and any notation the learner needs.
## Exercícios
6 to 10 exercises ordered by difficulty: application, analysis, then a challenge. Number them and state what is required.
${answers ? "## Soluções\nA complete answer key, with reasoning for each exercise." : "Do not include solutions."}`
}

function questionsStructure(template: LearningTemplate, answers: boolean) {
  if (template === "pedagogical") {
    return `Use this structure:
# <título claro em português>
> **Nível:** <infer it or write "não informado na fonte">
## 🎯 Competências-alvo
3 to 5 competencies covered by the questions.
## 🧠 Perguntas de conhecimento e memória
5 to 7 short questions on definitions, notation, and facts.
## 🔍 Perguntas de compreensão e interpretação
4 to 6 questions that ask the learner to explain, compare, or justify.
## 🛠️ Perguntas de aplicação
3 to 5 questions that apply the concepts to a new situation or exercise.
## 💬 Perguntas de análise e avaliação
2 to 4 open questions that require synthesis, argument, or critique.
${answers ? `## ✅ Respostas modelo
Model answers for every question. For open questions, give the expected elements rather than one rigid answer.` : "Do not include answers."}
## 📊 Critérios de avaliação
A short rubric: what a complete answer must include.`
  }
  if (template === "exam") {
    return `Use this structure:
# <título claro em português>
## Instruções
Duration and instructions.
## Perguntas curtas
6 to 8 short-answer questions.
## Perguntas de aplicação
3 to 5 application questions.
## Perguntas dissertativas
2 to 3 open questions.
${answers ? "## Respostas modelo e critérios de correção\nModel answers with marking points." : "Do not include answers."}`
  }
  if (template === "quick") {
    return `Use this structure:
# <título claro em português>
## Perguntas rápidas
8 to 10 short questions covering the whole source.
${answers ? "## Respostas\nA one-line answer for each question." : "Do not include answers."}`
  }
  return `Use this structure:
# <título claro em português>
## Perguntas curtas
8 to 12 short-answer questions that cover the whole source.
## Perguntas dissertativas
3 to 5 open questions that require synthesis or argument.
${answers ? "## Respostas modelo\nModel answers for every question, concise but complete." : "Do not include answers."}`
}

function structure(mode: LearningMode, template: LearningTemplate, answers: boolean) {
  if (mode === "summary") return summaryStructure(template, answers)
  if (mode === "lesson") return lessonStructure(template, answers)
  if (mode === "exercises") return exercisesStructure(template, answers)
  return questionsStructure(template, answers)
}

function lengthRule(mode: LearningMode, template: LearningTemplate) {
  if (template === "quick") return "Keep the whole document under about 900 words. Prefer density over volume."
  if (template === "pedagogical") {
    if (mode === "lesson") {
      return "Keep the whole lesson under about 1900 words. Use exactly 2 axes and include every subsection the source supports: definition, notes, examples, properties, table, and geometric interpretation. Use 1 detailed solved exercise with 2 or 3 questions. Do not repeat the same definition in several sections."
    }
    return "Keep the document under about 1800 words. Favor clear organization and complete answers over padding."
  }
  if (template === "exam") return "Keep the document under about 1600 words. Focus on what is assessed and on the method."
  return "Keep the document under about 2000 words. Be complete but do not repeat ideas."
}

function systemPrompt(mode: LearningMode, template: LearningTemplate, difficulty: LearningDifficulty, answers: boolean) {
  return `PRIMARY OBJECTIVE
Create a ${MODE_LABEL[mode]} from the provided source material.

OUTPUT
GitHub-flavored Markdown only. No code fences around the whole answer.
Use $...$ for inline math and $$...$$ for display math. Never use \(...\) or \[...\].


MATH FORMATTING
- Put every display-math $$ block on its own lines, outside blockquotes and lists.
- Never put ">" or bullet markers inside a $$ block.
- Close the surrounding paragraph or quote before starting display math.
- Every opening $ must have a closing $ on the same line, and every $$ block must be paired. Never write \( or \) anywhere.

NUMERIC AND LOGICAL CHECKS
- Recompute every numeric substitution before writing it: f(x0), f'(x0), and the final result must agree with the previous line.
- When f'(x)=0 at a point, say the derivative vanishes there and the tangent is horizontal. Never say the function is constant at that point.
- When using the intermediate value theorem, choose an interval with opposite signs at the endpoints and an interior root. Never design an exercise whose only root is an endpoint. If a root is at an endpoint, call it "no extremo do intervalo" and never describe it as interior.
- When claiming a root is unique, prove monotonicity on the entire stated interval. If f' changes sign inside it, the root is not unique: change the exercise or the interval.
- In a counterexample about an interior point, place that point strictly inside the interval, never at an endpoint.
- A horizontal tangent y=c is parallel to the x-axis and crosses the y-axis at (0,c). Never say it meets the x-axis at y=c.
- Say a function is continuous on its domain; do not add "open domain" unless the source does.
- When two different one-sided tangents exist, write "semirretas tangentes" and do not call the angle acute unless the source does.
- Check that every equation, implication, and sign table is internally consistent.

LANGUAGE
Write in Brazilian Portuguese. Keep numbers, symbols, and mathematical notation unchanged.

GROUNDING
Every statement must be supported by the source. Never invent facts, dates, names, formulas, or exercise statements.
If the source is short, produce a shorter document instead of padding.

STYLE
${difficultyRule(difficulty)}
${TEMPLATE_RULE[template]}

LENGTH
${lengthRule(mode, template)}

STRUCTURE
${structure(mode, template, answers)}

QUALITY BAR
- Every definition must be precise and usable.
- Every formula must be correct and written in LaTeX.
- Every solved example must show the reasoning, not only the result.
- Exercises must be solvable from the source and must not require invented data.
- Before stating a numerical fact, verify it from the source. For theorem-based exercises, choose values and intervals that actually satisfy the hypotheses.
- Preserve the direction of every implication and equivalence exactly as supported by the source. Never reverse a one-way statement.
- Write only in Brazilian Portuguese. Never mix in words or phrases from other languages.
- Never write a heading whose section has no substantive content and never state that the source lacks a table or figure; simply omit that subsection. Never drop a supported table or geometric interpretation just to save space.
- Do not include self-corrections, doubts, or meta-commentary about the source in the final document. Fix the issue silently before writing.
- Never invent named properties, theorems, or formulas; include only what the source supports. Never leave placeholder notes such as "não há tabela".
- If a section is not supported by the source, omit it instead of filling it with generic text.

FAIL-SAFE
Return the Markdown document now.`
}

export async function makeLearningFile(
  title: string,
  context: string,
  options: LearningOptions = {},
): Promise<LearningFile> {
  const mode: LearningMode =
    options.learningMode === "lesson" || options.learningMode === "exercises" || options.learningMode === "questions"
      ? options.learningMode
      : "summary"
  const template: LearningTemplate =
    options.template === "quick" || options.template === "exam" || options.template === "pedagogical"
      ? options.template
      : "academic"
  const difficulty: LearningDifficulty =
    options.difficulty === "easy" || options.difficulty === "hard" ? options.difficulty : "medium"
  const answers = options.answers !== false

  const sourceTitle = String(title || "").replace(/\.(pdf|docx?|pptx?|txt|md|markdown|json)$/i, "").trim() || title
  const user = `SOURCE TITLE:\n${sourceTitle}\n\nSOURCE MATERIAL:\n${context}\n\nWrite the ${MODE_LABEL[mode]} now. Return Markdown only.`
  const r = await llm.invoke([
    { role: "system", content: systemPrompt(mode, template, difficulty, answers) },
    { role: "user", content: user },
  ] as any)
  const usage = (r as any)?.usage_metadata
  if (process.env.LLM_DEBUG && usage) {
    console.log("[learning] usage", mode, template, "in", usage.input_tokens, "out", usage.output_tokens)
  }
  const raw = typeof r === "string" ? r : String((r as any)?.content ?? "")
  const markdown = cleanMarkdown(raw)
  if (!markdown) throw new Error("Empty learning file from model")
  return { mode, template, markdown }
}
