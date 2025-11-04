export const saveReport = (report: any) => {
  const existing = JSON.parse(localStorage.getItem("reports") || "[]");
  existing.push(report);
  localStorage.setItem("reports", JSON.stringify(existing));
};
