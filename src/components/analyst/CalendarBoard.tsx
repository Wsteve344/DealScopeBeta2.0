import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  defaultView?: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth';
  onAppointmentUpdate?: (appointment: Appointment) => Promise<void>;
  onAppointmentCreate?: (appointment: Appointment) => Promise<void>;
}

interface Appointment {
  id: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  startTime: Date;
  endTime: Date;
  dealName?: string;
  status: 'pending' | 'confirmed' | 'completed';
  notes?: string;
  analystId: string;
}

const CalendarBoard: React.FC<Props> = ({
  defaultView = 'timeGridWeek',
  onAppointmentUpdate,
  onAppointmentCreate
}) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment>({
    id: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000), // 1 hour from now
    dealName: '',
    status: 'pending',
    notes: '',
    analystId: user?.id || ''
  });
  const [showDragConfirm, setShowDragConfirm] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadAppointments();
    }
  }, [user?.id]);

  const loadAppointments = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('analyst_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAppointments(data.map(transformAppointment));
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const transformAppointment = (data: any): Appointment => ({
    id: data.id,
    contactName: data.contact_name,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    startTime: new Date(data.start_time),
    endTime: new Date(data.end_time),
    dealName: data.deal_name,
    status: data.status,
    notes: data.notes,
    analystId: data.analyst_id
  });

  const handleEventDrop = async (info: any) => {
    setDraggedEvent({
      event: info.event,
      oldStart: info.oldEvent.start,
      oldEnd: info.oldEvent.end
    });
    setShowDragConfirm(true);
  };

  const confirmEventDrop = async () => {
    if (!draggedEvent || !user?.id) return;

    try {
      const appointment = appointments.find(a => a.id === draggedEvent.event.id);
      if (!appointment) return;

      const updatedAppointment = {
        ...appointment,
        startTime: draggedEvent.event.start,
        endTime: draggedEvent.event.end
      };

      if (onAppointmentUpdate) {
        await onAppointmentUpdate(updatedAppointment);
      }

      const { error } = await supabase
        .from('appointments')
        .update({
          start_time: updatedAppointment.startTime,
          end_time: updatedAppointment.endTime
        })
        .eq('id', appointment.id);

      if (error) throw error;

      setAppointments(appointments.map(a => 
        a.id === appointment.id ? updatedAppointment : a
      ));
      toast.success('Appointment updated successfully');
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
      
      if (draggedEvent) {
        draggedEvent.event.setStart(draggedEvent.oldStart);
        draggedEvent.event.setEnd(draggedEvent.oldEnd);
      }
    } finally {
      setShowDragConfirm(false);
      setDraggedEvent(null);
    }
  };

  const cancelEventDrop = () => {
    if (draggedEvent) {
      draggedEvent.event.setStart(draggedEvent.oldStart);
      draggedEvent.event.setEnd(draggedEvent.oldEnd);
    }
    setShowDragConfirm(false);
    setDraggedEvent(null);
  };

  const handleEventClick = (info: any) => {
    const appointment = appointments.find(a => a.id === info.event.id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setShowModal(true);
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    if (!user?.id) return;

    setSelectedAppointment({
      id: crypto.randomUUID(),
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      startTime: selectInfo.start,
      endTime: selectInfo.end,
      dealName: '',
      status: 'pending',
      notes: '',
      analystId: user.id
    });
    setShowModal(true);
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      if (selectedAppointment.id && appointments.find(a => a.id === selectedAppointment.id)) {
        // Update existing appointment
        if (onAppointmentUpdate) {
          await onAppointmentUpdate(selectedAppointment);
        }

        const { error } = await supabase
          .from('appointments')
          .update({
            contact_name: selectedAppointment.contactName,
            contact_email: selectedAppointment.contactEmail,
            contact_phone: selectedAppointment.contactPhone,
            start_time: selectedAppointment.startTime,
            end_time: selectedAppointment.endTime,
            deal_name: selectedAppointment.dealName,
            status: selectedAppointment.status,
            notes: selectedAppointment.notes
          })
          .eq('id', selectedAppointment.id);

        if (error) throw error;

        setAppointments(appointments.map(a => 
          a.id === selectedAppointment.id ? selectedAppointment : a
        ));
      } else {
        // Create new appointment
        if (onAppointmentCreate) {
          await onAppointmentCreate(selectedAppointment);
        }

        const { error } = await supabase
          .from('appointments')
          .insert([{
            id: selectedAppointment.id,
            contact_name: selectedAppointment.contactName,
            contact_email: selectedAppointment.contactEmail,
            contact_phone: selectedAppointment.contactPhone,
            start_time: selectedAppointment.startTime,
            end_time: selectedAppointment.endTime,
            deal_name: selectedAppointment.dealName,
            status: selectedAppointment.status,
            notes: selectedAppointment.notes,
            analyst_id: user.id
          }]);

        if (error) throw error;

        setAppointments([...appointments, selectedAppointment]);
      }

      toast.success('Appointment saved successfully');
      setShowModal(false);
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error('Failed to save appointment');
    }
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981'; // green-500
      case 'confirmed':
        return '#3B82F6'; // blue-500
      default:
        return '#F59E0B'; // yellow-500
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Appointment Calendar</h2>
          <button
            onClick={() => {
              setSelectedAppointment({
                id: crypto.randomUUID(),
                contactName: '',
                contactEmail: '',
                contactPhone: '',
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000),
                dealName: '',
                status: 'pending',
                notes: '',
                analystId: user?.id || ''
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Appointment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={defaultView}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={appointments.map(appointment => ({
            id: appointment.id,
            title: appointment.contactName,
            start: appointment.startTime,
            end: appointment.endTime,
            backgroundColor: getEventColor(appointment.status),
            borderColor: getEventColor(appointment.status)
          }))}
          eventDrop={handleEventDrop}
          eventClick={handleEventClick}
          select={handleDateSelect}
          height="auto"
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedAppointment.id ? 'Edit Appointment' : 'New Appointment'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    value={selectedAppointment.contactName}
                    onChange={(e) => setSelectedAppointment(prev => 
                      prev ? { ...prev, contactName: e.target.value } : null
                    )}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    value={selectedAppointment.contactEmail}
                    onChange={(e) => setSelectedAppointment(prev => 
                      prev ? { ...prev, contactEmail: e.target.value } : null
                    )}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    value={selectedAppointment.contactPhone}
                    onChange={(e) => setSelectedAppointment(prev => 
                      prev ? { ...prev, contactPhone: e.target.value } : null
                    )}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="dealName" className="block text-sm font-medium text-gray-700">
                    Deal Name
                  </label>
                  <input
                    type="text"
                    id="dealName"
                    value={selectedAppointment.dealName}
                    onChange={(e) => setSelectedAppointment(prev => 
                      prev ? { ...prev, dealName: e.target.value } : null
                    )}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    value={selectedAppointment.status}
                    onChange={(e) => setSelectedAppointment(prev => 
                      prev ? { ...prev, status: e.target.value as Appointment['status'] } : null
                    )}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={selectedAppointment.notes}
                    onChange={(e) => setSelectedAppointment(prev => 
                      prev ? { ...prev, notes: e.target.value } : null
                    )}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDragConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Time Change
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to reschedule this appointment?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelEventDrop}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={confirmEventDrop}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarBoard;