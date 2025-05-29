import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BaselineIcon as PipelineIcon, Calendar, 
  BarChart, UserCog, UserCircle 
} from 'lucide-react';

const AnalystWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Analyst Portal</h2>
          <button
            onClick={() => navigate('/profile')}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            title="Profile"
          >
            <UserCircle className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4 space-y-4">
          <button
            onClick={() => navigate('/analyst')}
            className={`flex items-center space-x-2 transition-colors ${
              location.pathname === '/analyst'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/analyst/contacts')}
            className={`flex items-center space-x-2 transition-colors ${
              location.pathname.includes('/analyst/contacts')
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Contacts</span>
          </button>

          <button
            onClick={() => navigate('/analyst/pipeline')}
            className={`flex items-center space-x-2 transition-colors ${
              location.pathname === '/analyst/pipeline'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <PipelineIcon className="h-5 w-5" />
            <span>Pipeline</span>
          </button>

          <button
            onClick={() => navigate('/analyst/calendar')}
            className={`flex items-center space-x-2 transition-colors ${
              location.pathname === '/analyst/calendar'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span>Calendar</span>
          </button>

          <button
            onClick={() => navigate('/analyst/stats')}
            className={`flex items-center space-x-2 transition-colors ${
              location.pathname === '/analyst/stats'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <BarChart className="h-5 w-5" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => navigate('/analyst/customers')}
            className={`flex items-center space-x-2 transition-colors ${
              location.pathname === '/analyst/customers'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <UserCog className="h-5 w-5" />
            <span>Customers</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AnalystWorkspace;