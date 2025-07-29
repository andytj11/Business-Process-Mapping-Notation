'use client'
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from '../../components/NavBar';
import Sidebar from '../../components/SideBar';

function ProjectStructure() {
  const [formData, setFormData] = useState({
    hasPractitioner: '',
    hospitalDistance: '',
    projectedWomen: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="page-container flex flex-col h-screen">
      {/* Navigation Bar */}
      <NavBar />

      {/* Body Section */}
      <div className="flex flex-1 overflow-hidden bg-gray-50 pt-2">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 p-5 overflow-y-auto">
          {/* Steps Section */}
          <div className="steps">
            <div className="step active">1. Assign a PIC</div>
            <div className="step active">2. Gather Needs & Feasibility</div>
            <div className="step">3. Confirm Collaboration</div>
            <div className="step">4. Create Event</div>
          </div>

          {/* Form Section */}
          <div className="form-section">
            {/* Question 1 */}
            <div className="question">
              <label>Does the hospital have appropriate practitioners?</label>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="hasPractitioner"
                    value="Yes"
                    checked={formData.hasPractitioner === 'Yes'}
                    onChange={handleChange}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="hasPractitioner"
                    value="No"
                    checked={formData.hasPractitioner === 'No'}
                    onChange={handleChange}
                  />
                  No
                </label>
              </div>
            </div>

            {/* Question 2 */}
            <div className="question">
              <label>How far is the hospital from the testing site?</label>
              <select
                name="hospitalDistance"
                value={formData.hospitalDistance}
                onChange={handleChange}
              >
                <option value="">Select Distance</option>
                <option value="<250">1 - 250</option>
              </select>
            </div>

            {/* Question 3 */}
            <div className="question">
              <label>How many women are projected to participate?</label>
              <select
                name="projectedWomen"
                value={formData.projectedWomen}
                onChange={handleChange}
              >
                <option value="">Select Value</option>
                <option value="<50">10 - 50</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="actions">
            <button className="btn btn-secondary">Back</button>
            <button className="btn btn-primary">Next</button>
          </div>
        </div>
      </div>

      {/* Styling */}
      <style jsx>{`
        .steps {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }
        .step {
          padding: 10px;
          color: #999;
          border-bottom: 3px solid transparent;
          flex: 1;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          border-radius: 8px;
        }
        .step.active {
          color: #000;
          border-bottom: 3px solid #f0ad4e;
        }
        .form-section {
          background: #fff;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .question {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        .checkbox-group label {
          display: inline-block;
          margin-right: 20px;
        }
        select, input[type="checkbox"] {
          margin-top: 5px;
          padding: 8px;
          width: 100%;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .actions {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}

export default ProjectStructure;
