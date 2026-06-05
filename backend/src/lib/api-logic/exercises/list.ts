import type { Payload } from 'payload'

const EQUIPMENT_VALUES = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'smith_machine',
  'bodyweight',
] as const

type EquipmentValue = (typeof EQUIPMENT_VALUES)[number]

const toEquipmentValue = (value: unknown): EquipmentValue | undefined => {
  if (typeof value !== 'string' || value.length === 0) return undefined
  return (EQUIPMENT_VALUES as readonly string[]).includes(value)
    ? (value as EquipmentValue)
    : undefined
}

export async function createCustomExercise(
  payload: Payload,
  user: { id: string | number },
  body: { name?: string; muscleGroupId?: string | number; equipment?: unknown; isCustom?: boolean },
): Promise<{ status: number; body: unknown }> {
  const { name, muscleGroupId, equipment, isCustom } = body

  if (!name?.trim()) {
    return { status: 400, body: { error: 'Exercise name is required' } }
  }
  if (!muscleGroupId) {
    return { status: 400, body: { error: 'Muscle group is required' } }
  }

  const exercise = await payload.create({
    collection: 'exercises',
    data: {
      name: name.trim(),
      muscleGroup: Number(muscleGroupId),
      equipment: toEquipmentValue(equipment),
      isCustom: isCustom !== false,
      createdBy: Number(user.id),
    },
    overrideAccess: true,
  })

  const bodyPart =
    typeof exercise.muscleGroup === 'object' && exercise.muscleGroup !== null
      ? (exercise.muscleGroup as { name: string }).name
      : 'Other'

  return { status: 201, body: { doc: { id: String(exercise.id), name: exercise.name, bodyPart } } }
}

export async function listCustomExercises(
  payload: Payload,
  userId: string | number,
): Promise<{ status: number; body: unknown; headers?: Record<string, string> }> {
  const exercisesResponse = await payload.find({
    collection: 'exercises',
    limit: 1000,
    depth: 1,
    select: {
      id: true,
      name: true,
      muscleGroup: true,
      equipment: true,
    },
    sort: 'name',
    where: {
      or: [
        { isCustom: { equals: false } },
        {
          and: [{ isCustom: { equals: true } }, { createdBy: { equals: userId } }],
        },
      ],
    },
    overrideAccess: true,
  })

  const EQUIPMENT_LABELS: Record<string, string> = {
    barbell: 'Barbell',
    dumbbell: 'Dumbbell',
    machine: 'Machine',
    cable: 'Cable',
    smith_machine: 'Smith Machine',
    bodyweight: 'Bodyweight',
  }

  const exercises = exercisesResponse.docs.map((ex) => ({
    id: ex.id,
    name: ex.name,
    bodyPart: typeof ex.muscleGroup === 'object' ? ex.muscleGroup.name : 'Other',
    equipment: typeof ex.equipment === 'string' ? (EQUIPMENT_LABELS[ex.equipment] || ex.equipment) : undefined,
  }))

  return { status: 200, body: { docs: exercises } }
}
