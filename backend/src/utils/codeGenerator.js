async function nextCode(Model, field, prefix, digits = 4) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const latest = await Model.findOne({ [field]: new RegExp(`^${escaped}-\\d+$`) })
    .sort({ [field]: -1 })
    .select(field)
    .lean();
  const current = latest?.[field]?.match(/(\d+)$/)?.[1];
  const number = current ? Number(current) + 1 : 1;
  return `${prefix}-${String(number).padStart(digits, '0')}`;
}

export default nextCode;
