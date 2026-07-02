'use client';

import {
  useEffect,
  useState,
} from 'react';
import {
  Dumbbell,
  Plus,
  X,
} from 'lucide-react';
import { TrainerLayout } from '../../../components/layouts/trainer-layout';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { apiFetch } from '../../../lib/api';
import { useAuthGuard } from '../../../hooks/use-auth-guard';

type Workout = {
  id: string;
  name: string;
  type: 'HERCULES' | 'REFORMER';
  content: string;
};

export default function WorkoutsPage() {
  const authorized = useAuthGuard({
    requiredRole: 'TRAINER',
  });

  const [workouts, setWorkouts] =
    useState<Workout[]>([]);

  const [showModal, setShowModal] =
    useState(false);

  const [name, setName] =
    useState('');

  const [type, setType] =
    useState<'HERCULES' | 'REFORMER'>(
      'HERCULES'
    );

  const [content, setContent] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function loadWorkouts() {
    const data = await apiFetch(
      '/workouts'
    );

    setWorkouts(data);
  }

  async function createWorkout() {
    if (!name || !content) {
      alert(
        'Fill all required fields'
      );
      return;
    }

    try {
      setLoading(true);

      await apiFetch('/workouts', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type,
          content,
        }),
      });

      setName('');
      setType('HERCULES');
      setContent('');
      setShowModal(false);

      await loadWorkouts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteWorkout(
    workoutId: string
  ) {
    try {
      await apiFetch(
        `/workouts/${workoutId}`,
        {
          method: 'DELETE',
        }
      );

      await loadWorkouts();
    } catch (err: any) {
      alert(err.message);
    }
  }

  useEffect(() => {
    if (!authorized) return;
    loadWorkouts();
  }, [authorized]);

  if (!authorized) {
    return null;
  }

  const herculesWorkouts =
    workouts.filter(
      (w) => w.type === 'HERCULES'
    );

  const reformerWorkouts =
    workouts.filter(
      (w) => w.type === 'REFORMER'
    );

  return (
    <TrainerLayout>
      <div className="mb-6 flex flex-col gap-4 md:mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">
            Workouts
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-400 md:text-base">
            Create reusable workout templates
          </p>
        </div>

        <Button
          onClick={() =>
            setShowModal(true)
          }
          className="w-full sm:w-auto"
        >
          <Plus size={18} />
          Create Workout
        </Button>
      </div>

      <div className="space-y-8 md:space-y-10">
        <section>
          <div className="mb-5 flex items-center gap-3">
            <Dumbbell
              size={20}
              className="shrink-0"
            />

            <h2 className="text-xl font-semibold md:text-2xl">
              Hercules
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            {herculesWorkouts.length === 0 ? (
              <Card className="p-6 text-sm text-slate-400 md:p-8 md:text-base lg:col-span-2">
                No Hercules workouts yet
              </Card>
            ) : (
              herculesWorkouts.map((workout) => (
                <Card
                  key={workout.id}
                  className="p-5 md:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold md:text-xl">
                        {workout.name}
                      </h3>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() =>
                        deleteWorkout(
                          workout.id
                        )
                      }
                      className="w-full sm:w-auto"
                    >
                      Delete
                    </Button>
                  </div>

                  <pre className="mt-5 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">
                    {workout.content}
                  </pre>
                </Card>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center gap-3">
            <Dumbbell
              size={20}
              className="shrink-0"
            />

            <h2 className="text-xl font-semibold md:text-2xl">
              Reformer
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            {reformerWorkouts.length === 0 ? (
              <Card className="p-6 text-sm text-slate-400 md:p-8 md:text-base lg:col-span-2">
                No Reformer workouts yet
              </Card>
            ) : (
              reformerWorkouts.map((workout) => (
                <Card
                  key={workout.id}
                  className="p-5 md:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold md:text-xl">
                        {workout.name}
                      </h3>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() =>
                        deleteWorkout(
                          workout.id
                        )
                      }
                      className="w-full sm:w-auto"
                    >
                      Delete
                    </Button>
                  </div>

                  <pre className="mt-5 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">
                    {workout.content}
                  </pre>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center overflow-y-auto bg-black/70 p-4 md:items-center">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111118] p-5 shadow-2xl md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4 md:mb-6">
              <h2 className="text-xl font-semibold md:text-2xl">
                Create Workout
              </h2>

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="rounded-xl p-2 transition hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Workout name"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-violet-500/50 md:text-base"
              />

              <select
                value={type}
                onChange={(e) =>
                  setType(
                    e.target
                      .value as
                      | 'HERCULES'
                      | 'REFORMER'
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-violet-500/50 md:text-base"
              >
                <option value="HERCULES">
                  Hercules
                </option>

                <option value="REFORMER">
                  Reformer
                </option>
              </select>

              <textarea
                value={content}
                onChange={(e) =>
                  setContent(
                    e.target.value
                  )
                }
                placeholder="Workout instructions..."
                rows={10}
                className="max-h-[45vh] w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-violet-500/50 md:text-base"
              />

              <Button
                onClick={
                  createWorkout
                }
                disabled={loading}
                className="w-full"
              >
                {loading
                  ? 'Creating...'
                  : 'Create Workout'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </TrainerLayout>
  );
}