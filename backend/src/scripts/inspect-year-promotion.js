/**
 * 🔍 Inspect Year Promotion Data
 * ================================
 * سكريبت للفحص قبل تنفيذ ميزة ترقية السنوات
 * يجاوب على الأسئلة:
 *  1. إيه الـ levels الموجودة في النظام؟
 *  2. كل تخصص فيه كام فرقة وكام طالب في كل فرقة؟
 *  3. الطلاب في أعلى فرقة (المتوقع تخرجهم) مين هم؟
 *  4. الكورسات المسجلة - هل enrolledCourses مستخدمة؟
 *  5. هل في طلاب بـ level = 0 (إعدادي هندسة)؟
 *
 * تشغيل:
 *   node src/scripts/inspect-year-promotion.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");

const dbUri =
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/graduation-project";

// ────────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────────
const sep = (char = "─", len = 60) => char.repeat(len);
const header = (title) => {
  console.log("\n" + sep("═"));
  console.log(`  ${title}`);
  console.log(sep("═"));
};
const sub = (title) => {
  console.log("\n" + sep("─", 50));
  console.log(`  ${title}`);
  console.log(sep("─", 50));
};

// ────────────────────────────────────────────────
//  Main
// ────────────────────────────────────────────────
async function inspect() {
  console.log("\n🔗 Connecting to:", dbUri.replace(/:\/\/.*@/, "://***@"));
  await mongoose.connect(dbUri);
  console.log("✅ Connected!\n");

  const User = require("../models/User");
  const Specialization = require("../models/Specialization");
  const Course = require("../models/Course");

  // ────────────────────────────────────────────────
  //  1. SPECIALIZATIONS & THEIR LEVELS
  // ────────────────────────────────────────────────
  header("1️⃣  التخصصات والفرق المعرّفة في الـ Specialization model");

  const specs = await Specialization.find({}).lean();
  if (specs.length === 0) {
    console.log("  ⚠️  لا توجد تخصصات في قاعدة البيانات!");
  } else {
    for (const spec of specs) {
      console.log(`\n  📚 ${spec.name}  (${spec.code})  id: ${spec._id}`);
      if (spec.levels && spec.levels.length > 0) {
        console.log("     الفرق المعرّفة:");
        spec.levels.forEach((l) => {
          console.log(
            `       • Level ${l.level}  →  "${l.name}"  | hasDepartments: ${l.hasDepartments}`
          );
        });
      } else {
        console.log("     ⚠️  لا توجد levels معرّفة في هذا التخصص!");
      }
      if (spec.departments && spec.departments.length > 0) {
        console.log(`     الأقسام: ${spec.departments.join(", ")}`);
      }
    }
  }

  // ────────────────────────────────────────────────
  //  2. STUDENTS BY LEVEL (ALL SPECIALIZATIONS)
  // ────────────────────────────────────────────────
  header("2️⃣  توزيع الطلاب على الفرق (كل التخصصات)");

  const levelGroups = await User.aggregate([
    { $match: { role: "student" } },
    {
      $group: {
        _id: "$academicInfo.level",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalStudents = await User.countDocuments({ role: "student" });
  console.log(`\n  إجمالي الطلاب: ${totalStudents}`);
  console.log();

  if (levelGroups.length === 0) {
    console.log("  ⚠️  لا يوجد طلاب في قاعدة البيانات!");
  } else {
    let levelNull = 0;
    for (const g of levelGroups) {
      if (g._id === null || g._id === undefined) {
        levelNull = g.count;
        console.log(
          `  Level  null  →  ${g.count} طالب  ⚠️  (لا يحمل فرقة!)`
        );
      } else {
        const arrow = g._id === 0 ? "  (إعدادي هندسة)" : "";
        console.log(`  Level   ${g._id}   →  ${g.count} طالب${arrow}`);
      }
    }
    if (levelNull > 0) {
      console.log(
        "\n  ⚠️  يوجد طلاب بدون level - يجب مراجعتهم قبل الترقية!"
      );
    }
  }

  // ────────────────────────────────────────────────
  //  3. STUDENTS BY SPECIALIZATION & LEVEL
  // ────────────────────────────────────────────────
  header("3️⃣  توزيع الطلاب على التخصص والفرقة");

  const specLevelGroups = await User.aggregate([
    { $match: { role: "student" } },
    {
      $group: {
        _id: {
          spec: "$academicInfo.specialization",
          level: "$academicInfo.level",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.level": 1 } },
  ]);

  // Lookup specialization names
  const specMap = {};
  for (const s of specs) specMap[String(s._id)] = s.name;

  for (const g of specLevelGroups) {
    const specName = g._id.spec
      ? specMap[String(g._id.spec)] || g._id.spec
      : "⚠️ بدون تخصص";
    const levelLabel = g._id.level === null ? "null" : String(g._id.level);
    console.log(
      `  ${specName.padEnd(25)}  Level ${levelLabel.padEnd(4)}  →  ${g.count} طالب`
    );
  }

  // ────────────────────────────────────────────────
  //  4. MAX LEVEL PER SPECIALIZATION
  // ────────────────────────────────────────────────
  header("4️⃣  أعلى فرقة موجودة في كل تخصص (مين يتخرج؟)");

  for (const spec of specs) {
    const maxLevelData = await User.aggregate([
      {
        $match: {
          role: "student",
          "academicInfo.specialization": spec._id,
        },
      },
      {
        $group: {
          _id: "$academicInfo.level",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 1 },
    ]);

    if (maxLevelData.length === 0) {
      console.log(`\n  📚 ${spec.name}: ❌ لا يوجد طلاب`);
    } else {
      const maxLevel = maxLevelData[0]._id;
      const count = maxLevelData[0].count;
      const specLevels = spec.levels || [];
      const maxDefinedLevel =
        specLevels.length > 0
          ? Math.max(...specLevels.map((l) => l.level))
          : "غير معروف";

      console.log(`\n  📚 ${spec.name}`);
      console.log(
        `     أعلى level موجود فعلياً: ${maxLevel}  (${count} طالب)`
      );
      console.log(
        `     أعلى level معرّف في الـ model: ${maxDefinedLevel}`
      );
      if (maxLevel === maxDefinedLevel) {
        console.log(
          `     ⚡ هؤلاء الـ ${count} طالب سيتخرجون عند الترقية!`
        );
      }
    }
  }

  // ────────────────────────────────────────────────
  //  5. ENROLLED COURSES USAGE
  // ────────────────────────────────────────────────
  header("5️⃣  هل enrolledCourses في User مستخدمة؟");

  const studentsWithCourses = await User.countDocuments({
    role: "student",
    "academicInfo.enrolledCourses": { $exists: true, $not: { $size: 0 } },
  });

  const studentsWithNoCourses = await User.countDocuments({
    role: "student",
    $or: [
      { "academicInfo.enrolledCourses": { $exists: false } },
      { "academicInfo.enrolledCourses": { $size: 0 } },
    ],
  });

  console.log(`\n  طلاب لديهم enrolledCourses: ${studentsWithCourses}`);
  console.log(`  طلاب بدون enrolledCourses:  ${studentsWithNoCourses}`);

  if (studentsWithCourses === 0) {
    console.log(
      "\n  ℹ️  enrolledCourses غير مستخدمة - الكورسات مربوطة بـ Course.students"
    );
  } else {
    console.log("\n  ⚡ enrolledCourses مستخدمة - يجب مراعاتها عند الترقية!");
    // Show a sample
    const sample = await User.findOne({
      role: "student",
      "academicInfo.enrolledCourses": { $exists: true, $not: { $size: 0 } },
    })
      .select("studentId name academicInfo.enrolledCourses")
      .populate("academicInfo.enrolledCourses", "name code level");
    if (sample) {
      console.log(`\n  مثال - طالب: ${sample.studentId || sample._id}`);
      sample.academicInfo.enrolledCourses.forEach((c) => {
        console.log(`    → ${c.name} (${c.code}) - Level ${c.level}`);
      });
    }
  }

  // ────────────────────────────────────────────────
  //  6. COURSE.STUDENTS USAGE
  // ────────────────────────────────────────────────
  header("6️⃣  هل Course.students مستخدمة؟");

  const coursesWithStudents = await Course.countDocuments({
    students: { $exists: true, $not: { $size: 0 } },
  });
  const totalCourses = await Course.countDocuments({});

  console.log(`\n  إجمالي الكورسات: ${totalCourses}`);
  console.log(`  كورسات بها طلاب مسجلون: ${coursesWithStudents}`);

  if (coursesWithStudents > 0) {
    // Show top 5 courses with most students
    const topCourses = await Course.aggregate([
      { $match: { students: { $exists: true, $not: { $size: 0 } } } },
      { $project: { name: 1, code: 1, level: 1, studentCount: { $size: "$students" } } },
      { $sort: { studentCount: -1 } },
      { $limit: 5 },
    ]);
    console.log("\n  أكثر 5 كورسات بها طلاب:");
    topCourses.forEach((c) => {
      console.log(
        `    ${c.name} (${c.code}) - Level ${c.level} - ${c.studentCount} طالب`
      );
    });
  }

  // ────────────────────────────────────────────────
  //  7. LEVEL 0 CHECK (إعدادي هندسة)
  // ────────────────────────────────────────────────
  header("7️⃣  فحص level = 0 (إعدادي هندسة)");

  const level0Students = await User.countDocuments({
    role: "student",
    "academicInfo.level": 0,
  });

  if (level0Students > 0) {
    console.log(
      `\n  ✅ يوجد ${level0Students} طالب بـ level = 0 (إعدادي هندسة)`
    );
    console.log(
      "  ℹ️  الـ User model يحتاج تعديل: min: 0 بدلاً من min: 1"
    );
  } else {
    console.log("\n  ℹ️  لا يوجد طلاب بـ level = 0 حالياً");
    console.log(
      '  🔍 فحص الـ Specialization levels - هل في level اسمه "إعدادي"?'
    );
    // Check if any specialization has a level named إعدادي
    for (const spec of specs) {
      const prepLevel = (spec.levels || []).find(
        (l) =>
          l.name &&
          (l.name.includes("إعدادي") || l.name.includes("تحضيري"))
      );
      if (prepLevel) {
        console.log(
          `  ✅ ${spec.name} → level ${prepLevel.level} = "${prepLevel.name}"`
        );
      }
    }
  }

  // ────────────────────────────────────────────────
  //  8. INACTIVE STUDENTS
  // ────────────────────────────────────────────────
  header("8️⃣  الطلاب غير النشطين (isActive = false)");

  const inactiveCount = await User.countDocuments({
    role: "student",
    isActive: false,
  });

  console.log(`\n  طلاب غير نشطين: ${inactiveCount}`);
  if (inactiveCount > 0) {
    const inactiveSamples = await User.find({
      role: "student",
      isActive: false,
    })
      .select("studentId name academicInfo.level")
      .limit(5)
      .lean();
    console.log("  أمثلة:");
    inactiveSamples.forEach((s) => {
      console.log(
        `    • ${s.studentId || s._id}  -  Level ${s.academicInfo?.level ?? "N/A"}`
      );
    });
  }

  // ────────────────────────────────────────────────
  //  9. SUMMARY & RECOMMENDATIONS
  // ────────────────────────────────────────────────
  header("9️⃣  ملخص وتوصيات");

  console.log("\n  بناءً على البيانات الموجودة:");
  console.log();

  // Determine min and max levels from actual data
  const allLevels = levelGroups
    .map((g) => g._id)
    .filter((l) => l !== null && l !== undefined);
  if (allLevels.length > 0) {
    const minLevel = Math.min(...allLevels);
    const maxLevel = Math.max(...allLevels);
    console.log(`  • أصغر level موجود: ${minLevel}`);
    console.log(`  • أكبر level موجود: ${maxLevel}`);
    console.log();
    console.log("  📋 منطق الترقية المقترح:");
    for (let l = minLevel; l <= maxLevel; l++) {
      if (l === maxLevel) {
        console.log(`     Level ${l}  →  تخرج  (isActive = false)`);
      } else {
        console.log(`     Level ${l}  →  Level ${l + 1}`);
      }
    }
  }

  console.log();
  console.log("  🔑 نقاط تحتاج قرار قبل التنفيذ:");
  console.log(
    "     1. هل الطلاب المتخرجون يُعطَّل حسابهم أم يُحذفون؟"
  );
  console.log(
    "     2. هل Course.students يُنظَّف بعد الترقية (الكورسات القديمة)؟"
  );
  console.log(
    "     3. هل الترقية يدوية أم تلقائية في نهاية الفصل؟"
  );
  console.log();

  await mongoose.disconnect();
  console.log("\n🔌 Disconnected.\n");
}

// ────────────────────────────────────────────────
inspect().catch((err) => {
  console.error("❌ Script failed:", err.message);
  process.exit(1);
});
