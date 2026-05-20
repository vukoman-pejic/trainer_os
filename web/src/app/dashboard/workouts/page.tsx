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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Workouts
          </h1>

          <p className="mt-2 text-slate-400">
            Create reusable workout
            templates
          </p>
        </div>

        <Button
          onClick={() =>
            setShowModal(true)
          }
        >
          <Plus size={18} />
          Create Workout
        </Button>
      </div>

      <div className="space-y-10">
        <section>
          <div className="mb-5 flex items-center gap-3">
            <Dumbbell size={20} />
            <h2 className="text-2xl font-semibold">
              Hercules
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {herculesWorkouts.length ===
            0 ? (
              <Card className="col-span-2 p-8 text-slate-400">
                No Hercules workouts yet
              </Card>
            ) : (
              herculesWorkouts.map(
                (workout) => (
                  <Card
                    key={workout.id}
                    className="p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {
                            workout.name
                          }
                        </h3>
                      </div>

                      <Button
                        variant="destructive"
                        onClick={() =>
                          deleteWorkout(
                            workout.id
                          )
                        }
                      >
                        Delete
                      </Button>
                    </div>

                    <pre className="mt-5 whitespace-pre-wrap text-sm text-slate-300">
                      {
                        workout.content
                      }
                    </pre>
                  </Card>
                )
              )
            )}
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center gap-3">
            <Dumbbell size={20} />
            <h2 className="text-2xl font-semibold">
              Reformer
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {reformerWorkouts.length ===
            0 ? (
              <Card className="col-span-2 p-8 text-slate-400">
                No Reformer workouts yet
              </Card>
            ) : (
              reformerWorkouts.map(
                (workout) => (
                  <Card
                    key={workout.id}
                    className="p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {
                            workout.name
                          }
                        </h3>
                      </div>

                      <Button
                        variant="destructive"
                        onClick={() =>
                          deleteWorkout(
                            workout.id
                          )
                        }
                      >
                        Delete
                      </Button>
                    </div>

                    <pre className="mt-5 whitespace-pre-wrap text-sm text-slate-300">
                      {
                        workout.content
                      }
                    </pre>
                  </Card>
                )
              )
            )}
          </div>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111118] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                Create Workout
              </h2>

              <button
                onClick={() =>
                  setShowModal(false)
                }
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
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
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
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
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
                rows={12}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
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