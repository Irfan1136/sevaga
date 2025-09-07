export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-4">
      <h1 className="text-2xl font-bold">About SEVAGAN</h1>
      <p>
        SEVAGAN is a web-based blood donor management system designed to connect voluntary blood donors with people in urgent need of blood. It replaces manual lists with a secure, searchable database and OTP-verified access.
      </p>
      <ul className="list-disc pl-6">
        <li>Donor registration with mandatory details</li>
        <li>Secure login with mobile/email OTP</li>
        <li>Real-time donor search by blood group, city, pincode</li>
        <li>Responsive, free to use</li>
      </ul>
    </div>
  );
}
