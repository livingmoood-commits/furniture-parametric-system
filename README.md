# نظام تصنيع الأثاث البارامتري (LM Furniture)

**PARAMETRIC FURNITURE MANUFACTURING SYSTEM** — مش موقع تصميم بيديك صورة تقريبية، ده نظام
بتدخله المقاسات وبيطلعلك ملف تصنيع (Cutting List + Nesting + Drawings + QC) جاهز تبعته
للمصنع من غير ما يستنتج أي تفصيلة.

## المبدأ الأساسي: One Source of Truth

```
DATA (مدخلات المستخدم)
  ↓
ENGINEERING MODEL (قواعد بارامترية محسوبة)  — src/engine/rules/
  ↓
PARTS (قطع بـID ثابت)                        — src/engine/generators/
  ↓
CUTTING LIST
  ↓
NESTING (التوزيع على الألواح)                — src/engine/nesting/
  ↓
DRAWINGS (SVG مبني من نفس الأرقام)           — src/components/results/
  ↓
MANUFACTURING PACKAGE (طباعة/PDF)
```

كل حاجة في الواجهة بتتقرأ من `deriveProject()` (في `src/engine/derive.ts`) — مفيش رقم
مكتوب يدوي في أي مكون أو رسمة.

## التشغيل

```bash
npm install
npm run dev      # تطوير محلي
npm run test     # اختبارات الـ engine (قواعد، nesting، تناسق البيانات)
npm run build    # بناء للإنتاج + type-check
```

## البنية

- `src/models/` — الأنواع الأساسية: Project, Part, Material, Board, NestingResult, HardwareItem...
- `src/engine/rules/` — قواعد السرير والكومودينو البارامترية (bedRules.ts, nightstandRules.ts)
- `src/engine/generators/` — تحويل القواعد لقطع فعلية (bed/nightstand/free-furniture)
- `src/engine/nesting/` — محرك التقطيع (shelf-packing + kerf + تقسيم القطع الكبيرة)
- `src/engine/derive.ts` — نقطة الدخول الوحيدة للـpipeline كله
- `src/components/forms/` — إدخال بيانات المشروع
- `src/components/results/` — قائمة التقطيع، رسومات تقطيع الألواح، المنظور المتفكك، التجميع، الفحص النهائي

## وضع "قطع حرة"

جنب السرير/الكومودينو البارامتري، فيه وضع تاني لأي قطعة أثاث (دولاب، دريسينج، ترابيزة...)
بأبعاد يدوية بدل القواعد الجاهزة — وبيمر بنفس الـpipeline (قائمة تقطيع → تقطيع على اللوح → فحص).

## خارطة الطريق

- **Phase 2**: خوارزمية nesting أفضل (guillotine-cut / maximal-rectangles)، تصدير DXF لماكينة CNC، تعديل يدوي بالسحب والإفلات، حساب تكلفة تلقائي.
- **Phase 3**: قوالب لمنتجات تانية بنفس المعمارية، حفظ/تحميل المشاريع.
