// Contacto — formulario + WhatsApp + Facebook + Mapa
const { useState: ucS } = React;

function Contacto() {
  const E = window.ESTUDIO;
  const [form, setForm] = ucS({ nombre: "", email: "", telefono: "", proyecto: "cocina", mensaje: "" });
  const [sent, setSent] = ucS(false);

  const onChange = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.value }));
  const onSubmit = (e) => {
    e.preventDefault();
    // En el prototipo simulamos envío. Quien pase a Claude Code conectará el endpoint.
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <>
      <window.SiteHeader active="contacto" />

      <section className="hero" style={{paddingBottom: '1rem'}}>
        <div className="shell">
          <div className="hero-eyebrow">
            <span className="eyebrow">Contacto · Pedí presupuesto</span>
            <span className="eyebrow">Respuesta en 24–48hs</span>
          </div>
          <h1 className="hero-title" style={{fontSize: 'clamp(3rem, 8vw, 7rem)'}}>
            <span className="word-1">hablemos</span>
            <span className="word-2" style={{paddingLeft:'clamp(2rem, 10vw, 7rem)'}}>de tu idea.</span>
          </h1>
          <p className="lede" style={{marginTop: '2rem', maxWidth: '60ch'}}>
            Contanos qué ambiente o local querés transformar, sumá fotos o medidas si las tenés
            y te respondemos con una propuesta inicial. También podés escribirnos directamente
            por WhatsApp.
          </p>
        </div>
      </section>

      <section className="section" style={{paddingTop: '2rem'}}>
        <div className="shell">
          <div className="contact-grid">

            {/* Datos directos */}
            <div className="contact-card">
              <span className="eyebrow">Canales directos</span>

              <a className="contact-row" href={E.whatsappLink} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>
                <img className="icon" src="assets/icon-whatsapp.png" alt="" />
                <div>
                  <div className="label">WhatsApp</div>
                  <div className="value">{E.whatsapp}</div>
                </div>
              </a>

              <a className="contact-row" href={E.facebook} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>
                <img className="icon" src="assets/icon-facebook.png" alt="" />
                <div>
                  <div className="label">Facebook</div>
                  <div className="value">{E.facebookHandle}</div>
                </div>
              </a>

              <a className="contact-row" href={`mailto:${E.email}`} style={{textDecoration:'none'}}>
                <span className="icon-circle">@</span>
                <div>
                  <div className="label">Email</div>
                  <div className="value">{E.email}</div>
                </div>
              </a>

              <div className="contact-row">
                <span className="icon-circle" style={{fontSize:'1rem'}}>◉</span>
                <div>
                  <div className="label">Estudio</div>
                  <div className="value">{E.ciudad}, {E.pais}</div>
                </div>
              </div>

              <div className="map-frame" style={{marginTop:'1rem', minHeight: 280}}>
                <iframe
                  title="Ubicación AG Studio · Santa Rosa, La Pampa"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-64.3%2C-36.65%2C-64.25%2C-36.6&amp;layer=mapnik&amp;marker=-36.625%2C-64.275"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Formulario */}
            <div className="contact-card">
              <span className="eyebrow">Formulario</span>
              <h2 className="h2" style={{maxWidth: '14ch'}}>Contanos sobre <em>tu proyecto</em>.</h2>

              <form className="form" onSubmit={onSubmit}>
                <div className="form-row-2">
                  <div className="field">
                    <label htmlFor="nombre">Nombre</label>
                    <input id="nombre" required value={form.nombre} onChange={onChange("nombre")} placeholder="Tu nombre" />
                  </div>
                  <div className="field">
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" required value={form.email} onChange={onChange("email")} placeholder="vos@email.com" />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="field">
                    <label htmlFor="telefono">Teléfono</label>
                    <input id="telefono" value={form.telefono} onChange={onChange("telefono")} placeholder="(opcional)" />
                  </div>
                  <div className="field">
                    <label htmlFor="proyecto">Tipo de proyecto</label>
                    <select id="proyecto" value={form.proyecto} onChange={onChange("proyecto")}>
                      <option value="cocina">Cocina a medida</option>
                      <option value="living">Living / TV / Librería</option>
                      <option value="placard">Placards / vestidor</option>
                      <option value="comercio">Local comercial / oficina</option>
                      <option value="container">Container habitable</option>
                      <option value="integral">Proyecto integral</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="mensaje">Contanos brevemente</label>
                  <textarea id="mensaje" value={form.mensaje} onChange={onChange("mensaje")}
                    placeholder="Medidas aprox., uso del espacio, plazos, presupuesto estimado…" required />
                </div>

                <div style={{display:'flex', gap:'1rem', alignItems:'center', flexWrap:'wrap', marginTop:'.5rem'}}>
                  <button type="submit" className="btn btn-primary">
                    Enviar consulta <span className="arr">→</span>
                  </button>
                  <a href={E.whatsappLink} target="_blank" rel="noreferrer" className="btn btn-ghost">
                    O directo por WhatsApp
                  </a>
                  {sent && (
                    <span style={{fontFamily:'var(--font-mono)', fontSize:'.8rem', letterSpacing:'.1em', color:'var(--accent)', textTransform:'uppercase'}}>
                      ✓ Mensaje listo (prototipo)
                    </span>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <window.SiteFooter />
      {window.GurruTweaks && <window.GurruTweaks />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<Contacto />);
