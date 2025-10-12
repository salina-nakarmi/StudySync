import "react"
import {useState, useEffect} from "react"
import MotivationCard from '../components/MotivationCard';

const Dashboard = () => {
  return (
    <div className="p-4">
      <MotivationCard />
      {/* ...other dashboard content... */}
    </div>
  );
}

export default Dashboard

