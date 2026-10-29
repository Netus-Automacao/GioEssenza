"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "./ui";

const move = (arr, i, d) => { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; };

export default function Categories({ cats, setCats, prods, setToast, setTab }) {
  const [name, setName] = useState("");
  const count = (id) => prods.filter((p) => p.category_id === id).length;

  async function add(e) {
    e.preventDefault(); if (!name.trim()) return;
    const { data, error } = await supabase.from("categories").insert({ name: name.trim(), position: cats.length, active: true }).select().single();
    if (error) return setToast(error.message);
    setCats([...cats, data]); setName(""); setToast("Categoria criada");
  }
  async function update(c, fields, msg) {
    const { error } = await supabase.from("categories").update(fields).eq("id", c.id);
    if (error) return setToast(error.message);
    setCats(cats.map((x) => (x.id === c.id ? { ...x, ...fields } : x))); if (msg) setToast(msg);
  }
  async function reorder(i, d) {
    const next = move(cats, i, d).map((c, k) => ({ ...c, position: k }));
    setCats(next);
    await Promise.all(next.map((c) => supabase.from("categories").update({ position: c.position }).eq("id", c.id)));
  }
  async function del(c) {
    const n = count(c.id);
    if (n) return setToast(`“${c.name}” tem ${n} produto(s). Mude esses produtos de categoria ou exclua-os antes.`);
    if (!confirm(`Excluir a categoria “${c.name}”?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return setToast(error.message);
    setCats(cats.filter((x) => x.id !== c.id)); setToast("Categoria excluída");
  }

  return (
    <>
      <h1 className="ad-h1">Categorias</h1>
      <Card title="Nova categoria">
        <form className="ad-row" onSubmit={add}>
          <input className="ad-input grow" placeholder="Ex.: Agendas" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
          <button className="ad-btn">Criar categoria</button>
        </form>
      </Card>
      <Card title={`${cats.length} categorias`} desc="A ordem aqui é a ordem dos filtros no catálogo. Categorias inativas, ou sem produtos ativos, não aparecem para os clientes.">
        {cats.length === 0 ? <p className="ad-muted">Nenhuma categoria ainda.</p> : (
          <ul className="ad-cats">
            {cats.map((c, i) => (
              <li key={c.id} className={c.active === false ? "inactive" : ""}>
                <input defaultValue={c.name} onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== c.name && update(c, { name: e.target.value.trim() }, "Categoria renomeada")} aria-label="Nome da categoria" />
                <span className="ad-muted">{count(c.id)} produtos</span>
                <button className="ad-btn ghost sm" onClick={() => update(c, { active: c.active === false }, c.active === false ? "Categoria ativada" : "Categoria desativada")}>{c.active === false ? "Ativar" : "Desativar"}</button>
                <button className="ad-btn ghost sm" disabled={i === 0} onClick={() => reorder(i, -1)}>Subir</button>
                <button className="ad-btn ghost sm" disabled={i === cats.length - 1} onClick={() => reorder(i, 1)}>Descer</button>
                <button className="ad-btn ghost sm danger" onClick={() => del(c)}>Excluir</button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
