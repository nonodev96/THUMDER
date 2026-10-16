import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, type OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import type { InterfaceFileItem } from "@app/Types";
import { ExerciseService } from "@core/exercises/exercise.service";
import { answerOf, type Exercise, isRight, type Texts, type Topic } from "@core/exercises/exercises";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { StorageService } from "@core/storage/storage.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { firstValueFrom } from "rxjs";

const TOPICS: Topic[] = ["data", "control", "structural", "floating", "loops", "memory"];

/**
 * The guided exercises (EDU-04): a gallery by topic and, for the exercise open in the editor, its questions, checked
 * against the simulation when it ends
 */
@Component({
  selector: "view-exercises",
  templateUrl: "./exercises.view.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe],
})
export class ExercisesView implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private storage = inject(StorageService);
  private exercises = inject(ExerciseService);
  public machine = inject(MachineService);

  public readonly topics = TOPICS;
  public readonly catalogue = signal<Exercise[]>([]);
  public readonly failed = signal(false);
  /** The progress of each exercise (its file and the answers written) */
  public readonly progress = signal(this.exercises.progress());
  public readonly showSolutions = signal(false);
  /** The file open in the editor */
  private readonly openKey = signal((this.storage.getItem("interfaceFileItem") as InterfaceFileItem | null)?.key ?? "");

  /** The exercise of the file open in the editor, if it is one */
  public readonly active = computed(() => {
    const key = this.openKey();
    return this.catalogue().find((exercise) => this.progress()[exercise.id]?.fileKey === key) ?? null;
  });

  /** It can be checked when the simulation of its file has ended */
  public readonly canCheck = computed(() => {
    const exercise = this.active();
    return exercise !== null && this.machine.state.complete() && this.machine.state.fileKey() === this.progress()[exercise.id]?.fileKey;
  });

  async ngOnInit(): Promise<void> {
    try {
      this.catalogue.set(await firstValueFrom(this.http.get<Exercise[]>("assets/exercises/exercises.json")));
    } catch (error) {
      logger.error(error);
      this.failed.set(true);
    }
  }

  /** A text in the language of the interface */
  public text(texts: Texts): string {
    return (this.translate.getCurrentLang() ?? this.translate.getFallbackLang()) === "en" ? texts.en : texts.es;
  }

  public ofTopic(topic: Topic): Exercise[] {
    return this.catalogue().filter((exercise) => exercise.topic === topic);
  }

  public async start(exercise: Exercise): Promise<void> {
    const interfaceFileItem = await this.exercises.startGuided(exercise, this.text(exercise.statement));
    this.progress.set(this.exercises.progress());
    this.openKey.set(interfaceFileItem.key);
    await this.machine.resetMachineStatus();
    await this.router.navigateByUrl("/auth/editor", { state: { interfaceFileItem } });
  }

  public answer(exercise: Exercise, question: string): string {
    return this.progress()[exercise.id]?.answers[question] ?? "";
  }

  public write(exercise: Exercise, question: string, value: string): void {
    const current = this.progress()[exercise.id];
    if (!current) return;
    const next = { ...current, answers: { ...current.answers, [question]: value }, checked: false };
    this.exercises.saveProgress(exercise.id, next);
    this.progress.set(this.exercises.progress());
  }

  public check(exercise: Exercise): void {
    const current = this.progress()[exercise.id];
    if (!current || !this.canCheck()) return;
    this.exercises.saveProgress(exercise.id, { ...current, checked: true });
    this.progress.set(this.exercises.progress());
  }

  /** The right answer, from the simulation */
  public expected(exercise: Exercise, question: string): number | undefined {
    const found = exercise.questions.find((item) => item.id === question);
    if (!found) return undefined;
    return answerOf(found.answer, {
      statistics: this.machine.state.statistics(),
      register: (name) => {
        const number = Number(name.replace(/\D/g, ""));
        const register = this.machine.registers.R[number];
        return register ? Number.parseInt(register.hexValue, 16) | 0 : undefined;
      },
    });
  }

  public isRight(exercise: Exercise, question: string): boolean {
    return isRight(this.answer(exercise, question), this.expected(exercise, question));
  }

  public score(exercise: Exercise): number {
    return exercise.questions.filter((question) => this.isRight(exercise, question.id)).length;
  }
}
