#!/usr/bin/env python3
"""Generate a 100-question Origin / Insertion / Action coaching exam."""
from __future__ import annotations

import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "data" / "oia-exam.json"

# name, origin, insertion, primary_actions[], region
MUSCLES = [
    ("Pectoralis major", "Clavicle, sternum, and costal cartilages", "Lateral lip of the intertubercular (bicipital) groove of the humerus", ["Shoulder horizontal adduction", "Shoulder flexion (clavicular fibers)", "Shoulder internal rotation"], "Chest"),
    ("Pectoralis minor", "Ribs 3–5", "Coracoid process of the scapula", ["Scapular protraction", "Scapular downward rotation / anterior tilt contributions"], "Chest"),
    ("Serratus anterior", "Lateral surfaces of the upper ribs", "Medial border of the scapula (anterior surface)", ["Scapular protraction", "Scapular upward rotation"], "Scapula"),
    ("Trapezius (upper)", "Occiput / nuchal ligament / upper cervical spinous processes", "Lateral clavicle / acromion", ["Scapular elevation", "Upward rotation assistance"], "Scapula"),
    ("Trapezius (middle)", "Upper thoracic spinous processes", "Spine of the scapula / acromion region", ["Scapular retraction"], "Scapula"),
    ("Trapezius (lower)", "Lower thoracic spinous processes", "Spine of the scapula (medial root area)", ["Scapular depression", "Upward rotation assistance"], "Scapula"),
    ("Rhomboid major", "Spinous processes of upper thoracic vertebrae (approx. T2–T5)", "Medial border of the scapula", ["Scapular retraction", "Scapular downward rotation"], "Scapula"),
    ("Levator scapulae", "Transverse processes of upper cervical vertebrae", "Superior angle / medial border of the scapula", ["Scapular elevation", "Cervical ipsilateral side-bending/rotation contributions"], "Scapula"),
    ("Latissimus dorsi", "Thoracolumbar fascia, lower thoracic/lumbar spinous processes, iliac crest, lower ribs", "Floor of the intertubercular groove of the humerus", ["Shoulder extension", "Shoulder adduction", "Shoulder internal rotation"], "Back"),
    ("Teres major", "Inferior angle of the scapula (posterior surface)", "Medial lip of the intertubercular groove of the humerus", ["Shoulder extension", "Shoulder adduction", "Shoulder internal rotation"], "Back"),
    ("Anterior deltoid", "Lateral clavicle", "Deltoid tuberosity of the humerus", ["Shoulder flexion", "Shoulder horizontal adduction contributions"], "Shoulder"),
    ("Middle deltoid", "Acromion of the scapula", "Deltoid tuberosity of the humerus", ["Shoulder abduction"], "Shoulder"),
    ("Posterior deltoid", "Spine of the scapula", "Deltoid tuberosity of the humerus", ["Shoulder horizontal abduction", "Shoulder extension contributions"], "Shoulder"),
    ("Supraspinatus", "Supraspinous fossa of the scapula", "Greater tubercle of the humerus", ["Initiates shoulder abduction", "Glenohumeral stabilization"], "Rotator cuff"),
    ("Infraspinatus", "Infraspinous fossa of the scapula", "Greater tubercle of the humerus", ["Shoulder external rotation", "Glenohumeral stabilization"], "Rotator cuff"),
    ("Teres minor", "Lateral border of the scapula", "Greater tubercle of the humerus", ["Shoulder external rotation", "Glenohumeral stabilization"], "Rotator cuff"),
    ("Subscapularis", "Subscapular fossa of the scapula", "Lesser tubercle of the humerus", ["Shoulder internal rotation", "Glenohumeral stabilization"], "Rotator cuff"),
    ("Biceps brachii", "Long head: supraglenoid tubercle; short head: coracoid process", "Radial tuberosity", ["Elbow flexion", "Forearm supination", "Shoulder flexion assistance"], "Arm"),
    ("Brachialis", "Anterior distal humerus", "Ulnar tuberosity / coronoid process of the ulna", ["Elbow flexion"], "Arm"),
    ("Brachioradialis", "Lateral distal humerus (supracondylar ridge)", "Distal radius near the styloid process", ["Elbow flexion (especially in neutral grip)"], "Arm"),
    ("Triceps brachii", "Long head: infraglenoid tubercle; lateral/medial heads: posterior humerus", "Olecranon of the ulna", ["Elbow extension", "Shoulder extension assistance (long head)"], "Arm"),
    ("Anconeus", "Lateral epicondyle of the humerus", "Olecranon / proximal posterior ulna", ["Assists elbow extension", "Stabilizes elbow"], "Arm"),
    ("Rectus abdominis", "Pubic crest / pubic symphysis region", "Xiphoid process and costal cartilages of ribs 5–7", ["Trunk flexion", "Posterior pelvic tilt contributions"], "Core"),
    ("External oblique", "External surfaces of lower ribs", "Iliac crest, linea alba, pubic tubercle via aponeurosis", ["Trunk flexion", "Contralateral rotation", "Ipsilateral side-bending"], "Core"),
    ("Internal oblique", "Iliac crest / thoracolumbar fascia / inguinal ligament region", "Lower ribs and linea alba", ["Trunk flexion", "Ipsilateral rotation", "Ipsilateral side-bending"], "Core"),
    ("Transversus abdominis", "Iliac crest, thoracolumbar fascia, lower costal cartilages", "Linea alba via aponeurosis", ["Increases intra-abdominal pressure", "Deep trunk stabilization"], "Core"),
    ("Erector spinae", "Sacrum, iliac crest, and lumbar/thoracic vertebrae broadly", "Ribs and vertebrae/cranial attachments depending on division", ["Trunk extension", "Spinal stabilization"], "Core"),
    ("Quadratus lumborum", "Iliac crest / iliolumbar ligament", "12th rib and lumbar transverse processes", ["Ipsilateral trunk side-bending", "Pelvic hiking / lumbar stabilization"], "Core"),
    ("Diaphragm", "Xiphoid, lower costal cartilages, and lumbar vertebrae (crura)", "Central tendon", ["Primary muscle of inspiration"], "Core"),
    ("Iliacus", "Iliac fossa", "Lesser trochanter of the femur (as iliopsoas)", ["Hip flexion"], "Hip"),
    ("Psoas major", "Lumbar vertebral bodies/transverse processes", "Lesser trochanter of the femur (as iliopsoas)", ["Hip flexion", "Lumbar posture contributions"], "Hip"),
    ("Gluteus maximus", "Ilium, sacrum, coccyx, and sacrotuberous ligament region", "Gluteal tuberosity of the femur and IT band / fascia lata", ["Hip extension", "Hip external rotation"], "Hip"),
    ("Gluteus medius", "External surface of the ilium", "Greater trochanter of the femur", ["Hip abduction", "Pelvic control in single-leg stance"], "Hip"),
    ("Gluteus minimus", "External ilium (deeper)", "Greater trochanter of the femur", ["Hip abduction", "Hip internal rotation contributions"], "Hip"),
    ("Piriformis", "Anterior surface of the sacrum", "Greater trochanter of the femur", ["Hip external rotation", "Assists hip abduction when flexed"], "Hip"),
    ("Tensor fasciae latae (TFL)", "ASIS / anterior iliac crest region", "Iliotibial band", ["Hip flexion", "Hip abduction", "Hip internal rotation contributions"], "Hip"),
    ("Sartorius", "ASIS", "Proximal medial tibia (pes anserinus)", ["Hip flexion", "Hip abduction", "Hip external rotation", "Knee flexion assistance"], "Thigh"),
    ("Rectus femoris", "AIIS / ilium above acetabulum", "Tibial tuberosity via patellar tendon", ["Knee extension", "Hip flexion"], "Thigh"),
    ("Vastus lateralis", "Lateral femur / linea aspera region", "Tibial tuberosity via patellar tendon", ["Knee extension"], "Thigh"),
    ("Vastus medialis", "Medial femur / linea aspera region", "Tibial tuberosity via patellar tendon", ["Knee extension"], "Thigh"),
    ("Vastus intermedius", "Anterior femoral shaft", "Tibial tuberosity via patellar tendon", ["Knee extension"], "Thigh"),
    ("Biceps femoris", "Long head: ischial tuberosity; short head: linea aspera", "Head of the fibula", ["Knee flexion", "Hip extension (long head)", "Tibial external rotation"], "Thigh"),
    ("Semitendinosus", "Ischial tuberosity", "Proximal medial tibia (pes anserinus)", ["Knee flexion", "Hip extension", "Tibial internal rotation"], "Thigh"),
    ("Semimembranosus", "Ischial tuberosity", "Posterior medial tibial condyle", ["Knee flexion", "Hip extension", "Tibial internal rotation"], "Thigh"),
    ("Adductor longus", "Pubis (body / near pubic crest)", "Middle third of the linea aspera of the femur", ["Hip adduction", "Hip flexion assistance"], "Thigh"),
    ("Adductor magnus", "Pubis and ischial tuberosity (dual portions)", "Linea aspera and adductor tubercle of the femur", ["Hip adduction", "Hip extension (posterior fibers)"], "Thigh"),
    ("Gracilis", "Pubis (inferior ramus / body region)", "Proximal medial tibia (pes anserinus)", ["Hip adduction", "Knee flexion assistance"], "Thigh"),
    ("Pectineus", "Superior pubic ramus", "Pectineal line of the femur", ["Hip flexion", "Hip adduction"], "Thigh"),
    ("Gastrocnemius", "Posterior femoral condyles", "Calcaneus via Achilles tendon", ["Ankle plantarflexion", "Knee flexion assistance"], "Leg"),
    ("Soleus", "Posterior tibia and fibula", "Calcaneus via Achilles tendon", ["Ankle plantarflexion"], "Leg"),
    ("Tibialis anterior", "Lateral tibia and interosseous membrane", "Medial cuneiform and base of 1st metatarsal", ["Ankle dorsiflexion", "Foot inversion"], "Leg"),
    ("Tibialis posterior", "Posterior tibia/fibula and interosseous membrane", "Navicular and medial foot tarsals/metatarsals", ["Foot inversion", "Ankle plantarflexion assistance", "Medial arch support"], "Leg"),
    ("Fibularis (peroneus) longus", "Proximal lateral fibula", "Base of 1st metatarsal and medial cuneiform (plantar)", ["Foot eversion", "Ankle plantarflexion assistance"], "Leg"),
]

ORIGIN_DISTRACTORS = [
    "Greater tubercle of the humerus",
    "Lesser trochanter of the femur",
    "Olecranon of the ulna",
    "Tibial tuberosity",
    "Calcaneus via Achilles tendon",
    "Deltoid tuberosity of the humerus",
    "ASIS only with no other attachments",
    "Radial styloid only",
    "Xiphoid process only",
    "Head of the fibula only",
]

INSERTION_DISTRACTORS = [
    "Iliac fossa",
    "Supraspinous fossa of the scapula",
    "Pubic symphysis only",
    "Spinous processes of C1–C3 only",
    "Occipital protuberance only",
    "Medial epicondyle of the humerus",
    "Anterior superior iliac spine only as insertion",
    "Coronoid fossa of the humerus",
    "Manubrium of the sternum only",
    "Ischial tuberosity as a distal insertion",
]

ACTION_DISTRACTORS = [
    "Ankle dorsiflexion as its sole action",
    "Wrist ulnar deviation as its primary role",
    "Mandibular elevation",
    "Eyeball adduction",
    "Finger abduction as the prime mover",
    "Knee extension only with no hip role when it clearly has one, or vice versa as distractor wording",
    "Scapular upward rotation exclusively when it does not",
    "Trunk rotation to the opposite side exclusively when false",
]


def pick_other(rng: random.Random, options: list[str], correct: str, n: int = 3) -> list[str]:
    pool = [o for o in options if o != correct]
    rng.shuffle(pool)
    out = pool[:n]
    while len(out) < n:
        filler = rng.choice(ORIGIN_DISTRACTORS + INSERTION_DISTRACTORS)
        if filler != correct and filler not in out:
            out.append(filler)
    return out


def make_q(domain: str, question: str, correct: str, wrongs: list[str], rng: random.Random, explanation: str = "") -> dict:
    opts = [correct] + wrongs[:3]
    while len(opts) < 4:
        opts.append("Not a primary attachment or action for this muscle")
    order = [0, 1, 2, 3]
    rng.shuffle(order)
    shuffled = [opts[i] for i in order]
    return {
        "domain": domain,
        "question": question,
        "options": shuffled,
        "answer": order.index(0),
        "explanation": explanation,
    }


def build_questions() -> list[dict]:
    rng = random.Random(20251111)
    qs: list[dict] = []

    all_origins = [m[1] for m in MUSCLES]
    all_insertions = [m[2] for m in MUSCLES]
    all_actions = [a for m in MUSCLES for a in m[3]]
    names = [m[0] for m in MUSCLES]

    # Prefer underrepresented regions while cycling question types
    templates = ["origin", "insertion", "action", "identify_by_action", "coaching_action"]
    region_counts = {m[4]: 0 for m in MUSCLES}
    i = 0
    while len(qs) < 100:
        # Soft balance: occasionally pick from lowest-count regions
        if len(qs) > 20 and len(qs) % 3 == 0:
            target_region = min(region_counts, key=region_counts.get)
            candidates = [m for m in MUSCLES if m[4] == target_region]
            muscle = candidates[i % len(candidates)]
        else:
            muscle = MUSCLES[i % len(MUSCLES)]
        name, origin, insertion, actions, region = muscle
        region_counts[region] += 1
        kind = templates[len(qs) % len(templates)]
        domain = f"OIA · {region}"

        if kind == "origin":
            wrongs = pick_other(rng, all_origins + ORIGIN_DISTRACTORS, origin)
            # avoid accidental insertion as "correct looking"
            qs.append(
                make_q(
                    domain,
                    f"What is the primary origin region of the {name}?",
                    origin,
                    wrongs,
                    rng,
                    f"{name} originates from: {origin}.",
                )
            )
        elif kind == "insertion":
            wrongs = pick_other(rng, all_insertions + INSERTION_DISTRACTORS, insertion)
            qs.append(
                make_q(
                    domain,
                    f"Where does the {name} primarily insert?",
                    insertion,
                    wrongs,
                    rng,
                    f"{name} inserts on: {insertion}.",
                )
            )
        elif kind == "action":
            correct = actions[0]
            wrong_pool = [a for a in all_actions if a not in actions] + [
                "Wrist flexion as prime mover",
                "Mandibular depression",
                "Toe abduction only",
                "Elbow extension as sole action" if "Elbow extension" not in actions else "Ankle dorsiflexion as sole action",
            ]
            wrongs = pick_other(rng, wrong_pool, correct)
            qs.append(
                make_q(
                    domain,
                    f"Which is a primary action of the {name}?",
                    correct,
                    wrongs,
                    rng,
                    f"A key action of {name} is {correct}.",
                )
            )
        elif kind == "identify_by_action":
            correct = name
            action = actions[0]
            # choose muscles that do not share this exact primary listed action
            wrong_names = [n for n, _, _, acts, _ in MUSCLES if n != name and action not in acts]
            if len(wrong_names) < 3:
                wrong_names = [n for n in names if n != name]
            wrongs = pick_other(rng, wrong_names, correct)
            qs.append(
                make_q(
                    domain,
                    f"Which muscle is best known for this primary action: {action}?",
                    correct,
                    wrongs,
                    rng,
                    f"{correct} is a key muscle for {action}.",
                )
            )
        else:  # coaching_action
            correct = actions[0]
            prompts = [
                f"A client needs better {correct.lower()}. Which muscle should a coach prioritize teaching/loading among these options for the {name}?",
                f"During coaching, activating the {name} is most associated with:",
                f"If the {name} is the target muscle, which joint action should the coach emphasize?",
            ]
            # For first variant the correct answer is the muscle; keep it action-focused instead
            stem = prompts[len(qs) % 2 + 1]
            wrong_pool = [a for a in all_actions if a not in actions] + [
                "Finger opposition",
                "Eyebrow elevation",
                "Tongue protrusion",
            ]
            wrongs = pick_other(rng, wrong_pool, correct)
            qs.append(
                make_q(
                    domain,
                    stem,
                    correct,
                    wrongs,
                    rng,
                    f"Coaching emphasis for {name}: {correct}.",
                )
            )
        i += 1

    # Ensure uniqueness of stems; lightly diversify duplicates
    seen = {}
    for idx, q in enumerate(qs):
        stem = q["question"]
        if stem in seen:
            q["question"] = f"{stem} (variant {seen[stem] + 1})"
            seen[stem] += 1
        else:
            seen[stem] = 1
        q["id"] = idx + 1

    assert len(qs) == 100
    return qs


def main() -> None:
    questions = build_questions()
    regions = {}
    for q in questions:
        regions[q["domain"]] = regions.get(q["domain"], 0) + 1

    payload = {
        "id": "oia-exam",
        "title": "Origin, Insertion & Action",
        "subtitle": "Extensive muscle anatomy exam for coaching practice",
        "questionCount": 100,
        "domain": "Functional Anatomy · OIA",
        "meta": {
            "suggestedPassPercent": 70,
            "focus": [
                "Muscle origin identification",
                "Muscle insertion identification",
                "Primary actions",
                "Coaching application of OIA knowledge",
            ],
            "distributionNote": "Mixed upper body, scapula, core, hip, thigh, and lower-leg musculature.",
        },
        "questions": questions,
        "regionCounts": regions,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print(f"wrote {OUT} with {len(questions)} questions")
    print("region counts:", regions)


if __name__ == "__main__":
    main()
