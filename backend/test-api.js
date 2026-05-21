import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const token = jwt.sign(
    { id: 'ce960513-d8d9-4542-9266-ce4d8613637d', email: 'manu@tropica.me' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const res = await fetch('http://localhost:4000/api/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.text();
  console.log('Status:', res.status);
  console.log('Data:', data);
}
main();
