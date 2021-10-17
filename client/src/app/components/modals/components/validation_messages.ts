export const VALIDATION_MESSAGES = {
  lastName: [{ type: 'required', message: 'Last name is required' }],
  name: [{ type: 'required', message: 'Name is required' }],
  msisdn: [
    { type: 'required', message: 'Phone number is required' },
    { type: 'pattern', message: 'Enter a valid phone number' }
  ],
  email: [
    { type: 'required', message: 'Email is required' },
    { type: 'email', message: 'Enter a valid email' }
  ],
  gender: [{ type: 'required', message: 'Gender is required' }],
  capacity: [
    { type: 'required', message: 'Capacity is required' },
    { type: 'pattern', message: 'Enter a valid capacity' }
  ],
  subject: [
    { type: 'required', message: 'Course name is required' },
    { type: 'courseUnique', message: 'Course is already created' }
  ],
  teacher: [{ type: 'required', message: 'Educator is required' }],
  room: [{ type: 'required', message: 'Facility is required' }],
  group: [
    { type: 'required', message: 'Subclass is required' },
    {
      type: 'isDuplicate',
      message: 'Some name(s) are the same. Please, change subclass.'
    }
  ],
  // institution form
  country: [{ type: 'required', message: 'Country is required' }],
  city: [{ type: 'required', message: 'City is required' }],
  institutionFullName: [
    { type: 'required', message: 'Institution full name is required' }
  ],
  institutionShortName: [
    { type: 'required', message: 'Institution short name is required' }
  ],
  academicYear: [{ type: 'required', message: 'Academic year is required' }],
  branchFullName: [
    { type: 'required', message: 'Branch full name is required' }
  ],
  branchShortName: [
    { type: 'required', message: 'Branch short name is required' }
  ],
  startDate: [{ type: 'required', message: 'Start date is required' }],
  endDate: [{ type: 'required', message: 'End date is required' }]
};
