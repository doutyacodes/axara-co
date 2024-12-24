import React from "react";

// This component receives careerData as a prop, which contains the details for each career
const PDFCareerPage = ({ careerData }) => {
  return (
    <div className="pdf-career-page" style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#009be8" }}>Career Overview</h1>

      {careerData && (
        <div>
          <section style={{ marginBottom: "20px" }}>
            <h2 style={{ color: "#341e44" }}>Why This Career is Suitable for You</h2>
            <p>{careerData.reason_for_recommendation}</p>
          </section>

          <section style={{ marginBottom: "20px" }}>
            <h2 style={{ color: "#341e44" }}>Roadmap</h2>
            <p>{careerData.roadmap}</p>
          </section>

          <section style={{ marginBottom: "20px" }}>
            <h2 style={{ color: "#341e44" }}>Present Trends</h2>
            <p>{careerData.present_trends}</p>
          </section>

          <section style={{ marginBottom: "20px" }}>
            <h2 style={{ color: "#341e44" }}>Future Scope</h2>
            <p>{careerData.future_scope}</p>
          </section>

          <section style={{ marginBottom: "20px" }}>
            <h2 style={{ color: "#341e44" }}>Opportunities</h2>
            <p>{careerData.opportunities}</p>
          </section>

          <section style={{ marginBottom: "20px" }}>
            <h2 style={{ color: "#341e44" }}>Expenses</h2>
            <p>{careerData.expenses}</p>
          </section>
        </div>
      )}
    </div>
  );
};

export default PDFCareerPage;
