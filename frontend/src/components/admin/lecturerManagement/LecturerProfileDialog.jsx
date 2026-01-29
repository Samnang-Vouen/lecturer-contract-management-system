import React from 'react';
import { FileText, Eye, Download, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/Tabs';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Label from '../../ui/Label';
import Textarea from '../../ui/Textarea';
import Select, { SelectItem } from '../../ui/Select';
import Badge from '../../ui/Badge';
import { Card, CardContent } from '../../ui/Card';

export default function LecturerProfileDialog({
  isOpen,
  onClose,
  lecturer,
  setLecturer,
  readonly,
  activeTab,
  setActiveTab,
  onSave,
  onPayrollUpload,
  fileUrl
}) {
  if (!lecturer) return null;

  const handleTabChange = (newTab) => {
    console.log('Tab changing from', activeTab, 'to', newTab);
    setActiveTab(newTab);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[95vh] w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {readonly ? 'View Lecturer Profile' : 'Edit Lecturer Profile'}
          </DialogTitle>
          <DialogDescription>
            {readonly ? 'Profile details' : 'Update lecturer information and upload documents'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList ariaLabel='Profile sections'>
              <TabsTrigger value='basic'>
                Basic Info
              </TabsTrigger>
              <TabsTrigger value='bank'>
                Bank Info
              </TabsTrigger>
              <TabsTrigger value='education'>
                Education
              </TabsTrigger>
              <TabsTrigger value='work'>
                Experience
              </TabsTrigger>
              <TabsTrigger value='documents'>
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value='basic'>
              <div className='space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Full Name</Label>
                    <Input value={lecturer.name} readOnly />
                  </div>
                  <div className='space-y-2'>
                    <Label>Email</Label>
                    <Input value={lecturer.email} readOnly />
                  </div>
                  <div className='space-y-2'>
                    <Label>Phone</Label>
                    <Input 
                      value={lecturer.phone} 
                      onChange={e => setLecturer(p => ({ ...p, phone: e.target.value }))} 
                      readOnly={readonly} 
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Department</Label>
                    <Input value={lecturer.department} readOnly />
                  </div>
                  <div className='space-y-2'>
                    <Label>Position</Label>
                    {readonly ? (
                      <Input value={lecturer.position} readOnly />
                    ) : (
                      <Select 
                        value={lecturer.position} 
                        onValueChange={val => setLecturer(p => ({ ...p, position: val }))}
                      >
                        <SelectItem value='Lecturer'>Lecturer</SelectItem>
                        <SelectItem value='Teaching Assistant (TA)'>Teaching Assistant (TA)</SelectItem>
                      </Select>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label>Hourly Rate This Year ($)</Label>
                    <Input 
                      type='number' 
                      step='0.01' 
                      placeholder='0.00' 
                      value={lecturer.hourlyRateThisYear || ''} 
                      onChange={e => setLecturer(p => ({ ...p, hourlyRateThisYear: e.target.value }))} 
                      readOnly={readonly} 
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Status</Label>
                    {readonly ? (
                      <Input value={lecturer.status} readOnly />
                    ) : (
                      <Select 
                        value={lecturer.status} 
                        onValueChange={val => setLecturer(p => ({ ...p, status: val }))}
                      >
                        <SelectItem value='active'>Active</SelectItem>
                        <SelectItem value='inactive'>Inactive</SelectItem>
                        <SelectItem value='on-leave'>On Leave</SelectItem>
                      </Select>
                    )}
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label>Bio</Label>
                  <Textarea 
                    rows={4} 
                    value={lecturer.bio} 
                    onChange={e => setLecturer(p => ({ ...p, bio: e.target.value }))} 
                    readOnly={readonly} 
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Research Field</Label>
                  <div className='flex flex-wrap gap-2'>
                    {lecturer.specialization.length ? (
                      lecturer.specialization.map(spec => (
                        <Badge key={spec} variant='secondary'>{spec}</Badge>
                      ))
                    ) : (
                      <span className='text-xs text-gray-400'>None</span>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value='education'>
              <div className='space-y-4'>
                {lecturer.education.length ? (
                  lecturer.education.map(edu => (
                    <Card key={edu.id || edu.degree + edu.institution}>
                      <CardContent className='pt-4'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                          <div>
                            <Label className='text-xs font-semibold'>Degree</Label>
                            <p>{edu.degree}</p>
                          </div>
                          <div>
                            <Label className='text-xs font-semibold'>Institution</Label>
                            <p>{edu.institution}</p>
                          </div>
                          <div>
                            <Label className='text-xs font-semibold'>Major</Label>
                            <p>{edu.major}</p>
                          </div>
                          <div>
                            <Label className='text-xs font-semibold'>Year</Label>
                            <p>{edu.year}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className='text-gray-500 text-center py-8 text-sm'>No education records found</p>
                )}
              </div>
            </TabsContent>

            {/* Bank Info Tab */}
            <TabsContent value='bank'>
              <div className='space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Bank Name</Label>
                    <Input 
                      value={lecturer.bank_name || lecturer.bankName || ''} 
                      onChange={e => setLecturer(p => ({ ...p, bank_name: e.target.value }))} 
                      readOnly={readonly} 
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Account Name</Label>
                    <Input 
                      value={lecturer.account_name || lecturer.accountName || ''} 
                      onChange={e => setLecturer(p => ({ ...p, account_name: e.target.value }))} 
                      readOnly={readonly} 
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Account Number</Label>
                    <Input 
                      value={lecturer.account_number || lecturer.accountNumber || ''} 
                      onChange={e => setLecturer(p => ({ ...p, account_number: e.target.value }))} 
                      readOnly={readonly} 
                    />
                  </div>
                </div>
                
                {/* Payroll Document */}
                <div>
                  <Label className='text-base font-medium'>Payroll Document / Image</Label>
                  <div className='mt-2'>
                    {lecturer.payrollFilePath || lecturer.payrollUploaded ? (
                      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg'>
                        <div className='flex items-center gap-4 flex-1 min-w-0'>
                          {lecturer.payrollFilePath ? (() => {
                            const url = fileUrl(lecturer.payrollFilePath);
                            const isPdf = String(url).toLowerCase().endsWith('.pdf');
                            
                            if (isPdf) {
                              return (
                                <>
                                  <div className='w-24 h-16 flex items-center justify-center rounded-md border bg-gray-50'>
                                    <FileText className='w-8 h-8 text-red-600' />
                                  </div>
                                  <div>
                                    <p className='font-medium'>Uploaded Payroll</p>
                                    <p className='text-sm text-gray-600'>PDF Document</p>
                                  </div>
                                </>
                              );
                            }
                            
                            return (
                              <>
                                <img src={url} alt='Payroll' className='w-24 h-16 object-cover rounded-md border' />
                                <div>
                                  <p className='font-medium'>Uploaded Payroll</p>
                                  <p className='text-sm text-gray-600'>Preview below</p>
                                </div>
                              </>
                            );
                          })() : (
                            <div className='text-sm text-gray-500'>No payroll file available</div>
                          )}
                        </div>
                        <div className='flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end'>
                          {lecturer.payrollFilePath && (() => {
                            const url = fileUrl(lecturer.payrollFilePath);
                            return (
                              <>
                                <a 
                                  href={url} 
                                  target='_blank' 
                                  rel='noreferrer' 
                                  className='inline-flex items-center px-3 py-1.5 text-xs rounded border hover:bg-gray-50 whitespace-nowrap'
                                >
                                  <Eye className='w-4 h-4 mr-1'/> Preview
                                </a>
                                <a 
                                  href={url} 
                                  download 
                                  className='inline-flex items-center px-3 py-1.5 text-xs rounded border hover:bg-gray-50 whitespace-nowrap'
                                >
                                  <Download className='w-4 h-4 mr-1'/> Download
                                </a>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className='text-center py-8 border-2 border-dashed border-gray-300 rounded-lg'>
                        <p className='text-gray-600 text-sm'>No payroll uploaded</p>
                      </div>
                    )}
                    
                    {!readonly && (
                      <div className='flex items-center gap-4 mt-3'>
                        <input 
                          type='file' 
                          accept='image/*,.pdf' 
                          onChange={e => e.target.files?.[0] && onPayrollUpload(e.target.files[0])} 
                          className='hidden' 
                          id='payroll-upload'
                        />
                        <Label htmlFor='payroll-upload' className='cursor-pointer'>
                          <span className='inline-flex items-center px-3 py-2 text-xs rounded border bg-white hover:bg-gray-50'>
                            <Upload className='w-4 h-4 mr-1'/> Upload Payroll
                          </span>
                        </Label>
                        <p className='text-xs text-gray-600'>Image or PDF, max 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value='work'>
              <div className='space-y-4'>
                {(!lecturer.occupation && !lecturer.place) ? (
                  <p className='text-gray-500 text-center py-8 text-sm'>No work experience found</p>
                ) : (
                  <Card>
                    <CardContent className='pt-4'>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                        <div>
                          <Label className='text-xs font-semibold'>Occupation</Label>
                          <p>{lecturer.occupation || '—'}</p>
                        </div>
                        <div>
                          <Label className='text-xs font-semibold'>Place</Label>
                          <p>{lecturer.place || '—'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value='documents'>
              <div className='space-y-6'>
                {/* CV */}
                <div>
                  <Label className='text-base font-medium'>Curriculum Vitae (CV)</Label>
                  <div className='mt-2 space-y-4'>
                    {lecturer.cvUploaded ? (
                      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg'>
                        <div className='flex items-center flex-1 min-w-0'>
                          <FileText className='h-8 w-8 text-red-600 mr-3'/>
                          <div>
                            <p className='font-medium'>Current CV</p>
                            <p className='text-sm text-gray-600'>PDF Document</p>
                          </div>
                        </div>
                        <div className='flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end'>
                          {lecturer.cvFilePath && (() => {
                            const url = fileUrl(lecturer.cvFilePath);
                            return (
                              <>
                                <a 
                                  href={url} 
                                  target='_blank' 
                                  rel='noreferrer' 
                                  className='inline-flex items-center px-3 py-1.5 text-xs rounded border hover:bg-gray-50 whitespace-nowrap'
                                >
                                  <Eye className='w-4 h-4 mr-1'/> Preview
                                </a>
                                <a 
                                  href={url} 
                                  download 
                                  className='inline-flex items-center px-3 py-1.5 text-xs rounded border hover:bg-gray-50 whitespace-nowrap'
                                >
                                  <Download className='w-4 h-4 mr-1'/> Download
                                </a>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className='text-center py-8 border-2 border-dashed border-gray-300 rounded-lg'>
                        <FileText className='h-12 w-12 text-gray-400 mx-auto mb-4'/>
                        <p className='text-gray-600 text-sm'>No CV uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Syllabus */}
                <div>
                  <Label className='text-base font-medium'>Course Syllabus</Label>
                  <div className='mt-2 space-y-4'>
                    {lecturer.syllabusUploaded ? (
                      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg'>
                        <div className='flex items-center flex-1 min-w-0'>
                          <FileText className='h-8 w-8 text-blue-600 mr-3'/>
                          <div>
                            <p className='font-medium'>Current Syllabus</p>
                            <p className='text-sm text-gray-600'>PDF Document</p>
                          </div>
                        </div>
                        <div className='flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end'>
                          {lecturer.syllabusFilePath && (() => {
                            const url = fileUrl(lecturer.syllabusFilePath);
                            return (
                              <>
                                <a 
                                  href={url} 
                                  target='_blank' 
                                  rel='noreferrer' 
                                  className='inline-flex items-center px-3 py-1.5 text-xs rounded border hover:bg-gray-50 whitespace-nowrap'
                                >
                                  <Eye className='w-4 h-4 mr-1'/> Preview
                                </a>
                                <a 
                                  href={url} 
                                  download 
                                  className='inline-flex items-center px-3 py-1.5 text-xs rounded border hover:bg-gray-50 whitespace-nowrap'
                                >
                                  <Download className='w-4 h-4 mr-1'/> Download
                                </a>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className='text-center py-8 border-2 border-dashed border-gray-300 rounded-lg'>
                        <FileText className='h-12 w-12 text-gray-400 mx-auto mb-4'/>
                        <p className='text-gray-600 text-sm'>No syllabus uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className='flex flex-col sm:flex-row justify-end gap-2 border-t pt-4'>
            <Button 
              variant='outline' 
              onClick={onClose} 
              className='w-full sm:w-auto'
            >
              {readonly ? 'Close' : 'Cancel'}
            </Button>
            {!readonly && (
              <Button onClick={onSave} className='w-full sm:w-auto'>
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
